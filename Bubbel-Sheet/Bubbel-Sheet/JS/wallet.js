let walletBalance = 0;
let totalCharged = 0;
let totalSpent = 0;

/* =====================================================
TRANSACTION TYPES
===================================================== */

const TRANSACTION_TYPE = {
CHARGE: 1,
PURCHASE: 2
};


/* =====================================================
BALANCE DISPLAY
===================================================== */

function updateBalanceDisplay() {

const ids = [
    'mainBalance',
    'studentBalance',
    'studentBalanceMobile'
];

ids.forEach(id => {

    const el = document.getElementById(id);

    if (!el) return;

    el.style.transition =
        'transform .3s ease, opacity .3s ease';

    el.style.transform = 'scale(1.25)';
    el.style.opacity = '0';

    setTimeout(() => {

        el.textContent =
            Number(walletBalance || 0)
                .toLocaleString('en-US');

        el.style.transform = 'scale(1)';
        el.style.opacity = '1';

    }, 300);
});
}


/* =====================================================
QUICK STATS
===================================================== */

function updateQuickStats() {

const chargedEl =
    document.getElementById('totalChargedStat');

const spentEl =
    document.getElementById('totalSpentStat');


/* =========================
    TOTAL CHARGED
========================= */

if (chargedEl) {

    chargedEl.textContent =
        `+${Number(totalCharged || 0)
            .toLocaleString('en-US')}`;
}


/* =========================
    TOTAL SPENT
========================= */

if (spentEl) {

    spentEl.textContent =
        `-${Number(totalSpent || 0)
            .toLocaleString('en-US')}`;
}
}


/* =====================================================
GET WALLET DATA
===================================================== */

async function loadWalletData() {

try {

    const response =
        await apiRequest(
            '/code/gettransactiondata',
            {
                method: 'GET'
            }
        );


    /* =========================
        API ERROR
    ========================= */

    if (!response.ok) {

        console.error(
            'Wallet API Error:',
            response.status
        );

        return;
    }


    /* =========================
        READ RESPONSE
    ========================= */

    const data =
        await response.json();


    console.log(
        'Wallet API Response:',
        data
    );


    /* =========================
        EMPTY RESPONSE
    ========================= */

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        walletBalance = 0;
        totalCharged = 0;
        totalSpent = 0;

        updateBalanceDisplay();
        updateQuickStats();

        renderChargeHistory([]);
        renderPurchaseHistory([]);

        return;
    }


    /* =====================================================
        SORT TRANSACTIONS
        NEWEST FIRST
    ===================================================== */

    const sorted =
        [...data].sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );


    /* =====================================================
        SEPARATE TRANSACTIONS
    ===================================================== */

    const chargeTransactions =
        sorted.filter(
            item =>
                Number(item.transactionType) ===
                TRANSACTION_TYPE.CHARGE
        );


    const purchaseTransactions =
        sorted.filter(
            item =>
                Number(item.transactionType) ===
                TRANSACTION_TYPE.PURCHASE
        );


    /* =====================================================
        CURRENT BALANCE
    ===================================================== */

    const latestTransaction =
        sorted[0];


    walletBalance =
        Number(
            latestTransaction?.balanceAfter
        ) || 0;


    /* =====================================================
        TOTAL CHARGED
        
        IMPORTANT:
        Only transactionType = 1
    ===================================================== */

    totalCharged =
        chargeTransactions.reduce(
            (sum, item) =>
                sum +
                Math.abs(
                    Number(item.amount) || 0
                ),
            0
        );


    /* =====================================================
        TOTAL SPENT
        
        IMPORTANT:
        Only transactionType = 2
    ===================================================== */

    totalSpent =
        purchaseTransactions.reduce(
            (sum, item) =>
                sum +
                Math.abs(
                    Number(item.amount) || 0
                ),
            0
        );


    /* =====================================================
        UPDATE UI
    ===================================================== */

    updateBalanceDisplay();

    updateQuickStats();


    /* =====================================================
        RENDER CHARGE HISTORY
    ===================================================== */

    renderChargeHistory(
        chargeTransactions
    );


    /* =====================================================
        RENDER PURCHASE HISTORY
    ===================================================== */

    renderPurchaseHistory(
        purchaseTransactions
    );


} catch (error) {

    console.error(
        'Failed to load wallet data:',
        error
    );
}
}
/* =====================================================
POST CHARGE CODE
===================================================== */

async function activateCode() {

const input =
    document.getElementById('chargeCodeInput');

const btn =
    document.getElementById('chargeBtn');


/* =========================
    ELEMENTS CHECK
========================= */

if (!input || !btn) {
    return;
}


/* =========================
    GET INPUT
========================= */

const text =
    input.value.trim();


/* =========================
    VALIDATE INPUT
========================= */

if (!text) {

    showAlert(
        'error',
        'bi-exclamation-triangle-fill',
        'يرجى إدخال كود الشحن أولاً.'
    );

    input.focus();

    return;
}


/* =========================
    DISABLE BUTTON
========================= */

btn.disabled = true;

btn.innerHTML = `
    <span
        class="spinner-border text-white"
        role="status"
        aria-hidden="true">
    </span>

    <span>
        جارٍ التحقق...
    </span>
`;


try {

    /* =====================================================
        API REQUEST
    ===================================================== */

    const response =
        await apiRequest(
            '/code/redeem',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',

                    'Accept':
                        'application/json'
                },

                body: JSON.stringify({
                    text: text
                })
            }
        );


    /* =====================================================
        READ RESPONSE
    ===================================================== */

    const responseText =
        await response.text();


    console.log(
        'Charge API Status:',
        response.status
    );


    console.log(
        'Charge API Response:',
        responseText
    );


    /* =====================================================
        PARSE RESPONSE
    ===================================================== */

    let data = null;


    try {

        data =
            responseText
                ? JSON.parse(responseText)
                : null;

    } catch {

        data = responseText;
    }


    /* =====================================================
        SUCCESS
        200 - 299
    ===================================================== */

    if (response.ok) {

        input.value = '';


        showAlert(
            'success',
            'bi-check-circle-fill',
            data?.message ||
            'تم تفعيل كود الشحن بنجاح وإضافة الرصيد إلى محفظتك.'
        );


        /* =========================
            RELOAD WALLET
        ========================= */

        await loadWalletData();

        return;
    }


    /* =====================================================
        400 - BAD REQUEST
    ===================================================== */

    if (response.status === 400) {

        let message =
            'كود الشحن غير صالح.';


        if (
            data &&
            typeof data === 'object'
        ) {

            const apiMessage =
                String(
                    data.message ||
                    data.error ||
                    data.title ||
                    ''
                );


            const normalizedMessage =
                apiMessage.toLowerCase();


            /* =========================
                USED CODE
            ========================= */

            if (
                normalizedMessage.includes(
                    'already used'
                ) ||

                normalizedMessage.includes(
                    'already redeemed'
                ) ||

                normalizedMessage.includes(
                    'used before'
                ) ||

                normalizedMessage.includes(
                    'redeemed'
                )
            ) {

                message =
                    'كود الشحن ده تم استخدامه من قبل.';

            } else if (apiMessage) {

                message =
                    apiMessage;
            }

        } else if (
            typeof data === 'string' &&
            data.trim()
        ) {

            const normalizedMessage =
                data.toLowerCase();


            if (
                normalizedMessage.includes(
                    'already used'
                ) ||

                normalizedMessage.includes(
                    'already redeemed'
                ) ||

                normalizedMessage.includes(
                    'used before'
                ) ||

                normalizedMessage.includes(
                    'redeemed'
                )
            ) {

                message =
                    'كود الشحن ده تم استخدامه من قبل.';

            } else {

                message =
                    data;
            }
        }


        showAlert(
            'error',
            'bi-exclamation-circle-fill',
            message
        );

        return;
    }


    /* =====================================================
        401 - UNAUTHORIZED
    ===================================================== */

    if (response.status === 401) {

        showAlert(
            'error',
            'bi-person-lock',
            'انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.'
        );

        return;
    }


    /* =====================================================
        403 - FORBIDDEN
    ===================================================== */

    if (response.status === 403) {

        showAlert(
            'error',
            'bi-shield-exclamation',
            'ليس لديك صلاحية لتنفيذ عملية الشحن.'
        );

        return;
    }


    /* =====================================================
        404 - NOT FOUND
    ===================================================== */

    if (response.status === 404) {

        showAlert(
            'error',
            'bi-search',
            'كود الشحن غير موجود أو غير صالح.'
        );

        return;
    }


    /* =====================================================
        409 - CONFLICT
    ===================================================== */

    if (response.status === 409) {

        showAlert(
            'error',
            'bi-exclamation-circle-fill',
            'كود الشحن ده تم استخدامه من قبل.'
        );

        return;
    }


    /* =====================================================
        500+ - SERVER ERROR
    ===================================================== */

    if (response.status >= 500) {

        console.error(
            'Wallet Server Error:',
            response.status,
            data
        );


        showAlert(
            'error',
            'bi-server',
            'حدث خطأ في السيرفر، حاول مرة أخرى لاحقًا.'
        );

        return;
    }


    /* =====================================================
        OTHER HTTP ERRORS
    ===================================================== */

    let message =
        'حدث خطأ أثناء تفعيل كود الشحن.';


    if (
        data &&
        typeof data === 'object'
    ) {

        message =
            data.message ||
            data.error ||
            data.title ||
            message;

    } else if (
        typeof data === 'string' &&
        data.trim()
    ) {

        message =
            data;
    }


    showAlert(
        'error',
        'bi-x-circle-fill',
        message
    );


} catch (error) {

    /* =====================================================
        NETWORK ERROR
    ===================================================== */

    console.error(
        'Charge Code Network Error:',
        error
    );


    showAlert(
        'error',
        'bi-wifi-off',
        'تعذر الاتصال بالسيرفر، تأكد من اتصال الإنترنت وحاول مرة أخرى.'
    );


} finally {

    /* =====================================================
        RESTORE BUTTON
    ===================================================== */

    btn.disabled = false;


    btn.innerHTML = `
        <i class="bi bi-lightning-charge-fill"></i>

        <span id="chargeBtnText">
            تفعيل الكود
        </span>
    `;
}
}
/* =====================================================
RENDER CHARGE HISTORY
transactionType = 1
===================================================== */

function renderChargeHistory(transactions) {

const tbody =
    document.getElementById('chargeTableBody');

if (!tbody) return;


/* =========================
    CLEAR TABLE
========================= */

tbody.innerHTML = '';


/* =========================
    EMPTY STATE
========================= */

if (
    !Array.isArray(transactions) ||
    transactions.length === 0
) {

    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                لا توجد عمليات شحن حتى الآن
            </td>
        </tr>
    `;

    return;
}


/* =========================
    RENDER
========================= */

transactions.forEach(
    (transaction, index) => {

        const amount =
            Math.abs(
                Number(transaction.amount) || 0
            );


        const reference =
            transaction.reference ||
            '-';


        const date =
            formatDate(
                transaction.createdAt
            );


        const tr =
            document.createElement('tr');


        tr.innerHTML = `

            <!-- NUMBER -->
            <td>
                ${index + 1}
            </td>


            <!-- DATE -->
            <td>
                ${date}
            </td>


            <!-- CODE -->
            <td>
                <span class="code-cell">
                    ${reference}
                </span>
            </td>


            <!-- AMOUNT -->
            <td class="amount-cell amount-pos">
                +${amount.toLocaleString('en-US')}
                ج.م
            </td>


            <!-- STATUS -->
            <td>
                <span class="badge-status bs-success">

                    <i class="bi bi-check-circle-fill"></i>

                    شحن ناجح

                </span>
            </td>

        `;


        tbody.appendChild(tr);
    }
);
}


/* =====================================================
RENDER PURCHASE HISTORY
transactionType = 2
===================================================== */

function renderPurchaseHistory(transactions) {

const tbody =
    document.getElementById(
        'purchaseTableBody'
    );

if (!tbody) return;


/* =========================
    CLEAR TABLE
========================= */

tbody.innerHTML = '';


/* =========================
    EMPTY STATE
========================= */

if (
    !Array.isArray(transactions) ||
    transactions.length === 0
) {

    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                لا توجد مشتريات حتى الآن
            </td>
        </tr>
    `;

    return;
}


/* =========================
    RENDER
========================= */

transactions.forEach(
    (transaction, index) => {

        const amount =
            Math.abs(
                Number(transaction.amount) || 0
            );


        /* =========================
            MATERIAL NAME
        ========================= */

        const materialName =
            transaction.reference ||
            'مادة تعليمية';


        /* =========================
            DATE
        ========================= */

        const date =
            formatDate(
                transaction.createdAt
            );


        /* =========================
            ROW
        ========================= */

        const tr =
            document.createElement('tr');


        tr.innerHTML = `

            <!-- NUMBER -->
            <td>
                ${index + 1}
            </td>


            <!-- MATERIAL -->
            <td>

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <div style="
                        width:38px;
                        height:38px;
                        border-radius:12px;
                        background:var(--gm);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:#fff;
                        font-size:1rem;
                        flex-shrink:0;
                    ">

                        <i class="bi bi-book-fill"></i>

                    </div>


                    <div>

                        <div style="
                            font-weight:800;
                            color:var(--text-dark);
                        ">
                            ${materialName}
                        </div>


                        <div style="
                            font-size:.75rem;
                            color:var(--text-muted);
                        ">
                            عملية شراء
                        </div>

                    </div>

                </div>

            </td>


            <!-- PRICE -->
            <td class="amount-cell amount-neg">

                -${amount.toLocaleString('en-US')}
                ج.م

            </td>


            <!-- DATE -->
            <td>
                ${date}
            </td>


            <!-- STATUS -->
            <td>

                <span class="badge-status bs-success">

                    <i class="bi bi-check-circle-fill"></i>

                    مكتمل

                </span>

            </td>

        `;


        tbody.appendChild(tr);
    }
);
}


/* =====================================================
FORMAT DATE
===================================================== */

function formatDate(dateValue) {

if (!dateValue) {
    return '-';
}


const date =
    new Date(dateValue);


/* =========================
    INVALID DATE
========================= */

if (
    isNaN(
        date.getTime()
    )
) {

    return dateValue;
}


return date.toLocaleString(
    'en-US',
    {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }
);
}


/* =====================================================
ALERT
===================================================== */

function showAlert(
type,
icon,
msg
) {

const wrap =
    document.getElementById(
        'chargeAlert'
    );


if (!wrap) return;


/* =========================
    SHOW
========================= */

wrap.style.display =
    'block';


/* =========================
    ALERT HTML
========================= */

wrap.innerHTML = `

    <div class="wallet-alert ${
        type === 'success'
            ? 'alert-success-gl'
            : 'alert-error-gl'
    }">

        <i class="bi ${icon}"></i>

        <span>
            ${msg}
        </span>

    </div>

`;


/* =========================
    AUTO HIDE
========================= */

setTimeout(
    () => {

        const alertEl =
            wrap.querySelector(
                '.wallet-alert'
            );


        if (!alertEl) {
            return;
        }


        alertEl.style.transition =
            'opacity .5s ease';


        alertEl.style.opacity =
            '0';


        setTimeout(
            () => {

                wrap.style.display =
                    'none';

            },
            500
        );

    },
    5000
);
}
/* =====================================================
SCROLL REVEAL
===================================================== */

(function () {

const elements =
    document.querySelectorAll('[data-r]');


if (!elements.length) {
    return;
}


const observer =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (
                    !entry.isIntersecting
                ) {
                    return;
                }


                entry.target.classList.add(
                    'vis'
                );


                observer.unobserve(
                    entry.target
                );

            });

        },
        {
            threshold: 0.1,

            rootMargin:
                '0px 0px -30px 0px'
        }
    );


elements.forEach(el => {

    const delay =
        el.dataset.d;


    if (delay) {

        const delayMap = {

            d1: '60ms',

            d2: '120ms',

            d3: '200ms',

            d4: '280ms'

        };


        el.style.transitionDelay =
            delayMap[delay] ||
            '0ms';
    }


    observer.observe(el);

});

})();


/* =====================================================
PAGE INITIALIZATION
===================================================== */

document.addEventListener(
'DOMContentLoaded',
async function () {

    /* =================================================
        CHARGE INPUT
    ================================================= */

    const chargeInput =
        document.getElementById(
            'chargeCodeInput'
        );


    if (chargeInput) {

        chargeInput.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key === 'Enter'
                ) {

                    event.preventDefault();

                    activateCode();
                }

            }
        );
    }


    /* =================================================
        AUTHENTICATION
    ================================================= */

    try {

        const refreshed =
            await refreshToken();


        if (!refreshed) {

            window.location.href =
                'login.html';

            return;
        }


    } catch (error) {

        console.error(
            'Refresh Token Error:',
            error
        );


        window.location.href =
            'login.html';

        return;
    }


    /* =================================================
        LOAD WALLET DATA
    ================================================= */

    await loadWalletData();

}
);