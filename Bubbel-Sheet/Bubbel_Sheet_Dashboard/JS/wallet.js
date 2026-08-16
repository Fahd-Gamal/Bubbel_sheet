/* =========================================================
   BUBBLE SHEET WALLET
   FRONTEND VERSION
   API DISABLED FOR NOW
   ========================================================= */


/* =========================================================
   DEMO DATA
   ========================================================= */

let walletCodes = [
    {
        code: "BS-582941",
        amount: 100,
        used: true,
        date: "07/08/2026 - 05:30 م"
    },

    {
        code: "BS-739215",
        amount: 150,
        used: false,
        date: "07/08/2026 - 04:15 م"
    },

    {
        code: "BS-421876",
        amount: 200,
        used: false,
        date: "06/08/2026 - 08:42 م"
    },

    {
        code: "BS-914527",
        amount: 50,
        used: true,
        date: "06/08/2026 - 02:10 م"
    }
];


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(value) {

    return Number(value || 0).toLocaleString("EG");

}


/* =========================================================
   SUMMARY
   ========================================================= */

function calculateSummary() {

    let sales = 0;

    let consumed = 0;

    let uncharged = 0;


    walletCodes.forEach(code => {

        sales += Number(code.amount) || 0;


        if (code.used) {

            consumed += Number(code.amount) || 0;

        } else {

            uncharged += Number(code.amount) || 0;

        }

    });


    return {
        sales,
        consumed,
        uncharged
    };

}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSummary() {

    const summary = calculateSummary();


    const salesElement =
        document.getElementById("totalSales");

    const consumedElement =
        document.getElementById("consumedBalance");

    const unchargedElement =
        document.getElementById("unchargedBalance");

    const codesElement =
        document.getElementById("codesCount");


    animateValue(
        salesElement,
        summary.sales
    );


    animateValue(
        consumedElement,
        summary.consumed
    );


    animateValue(
        unchargedElement,
        summary.uncharged
    );


    if (codesElement) {

        codesElement.textContent =
            `${walletCodes.length} كود`;

    }

}


/* =========================================================
   NUMBER ANIMATION
   ========================================================= */

function animateValue(element, value) {

    if (!element) return;


    element.style.transform = "scale(1.12)";

    element.style.opacity = "0";


    setTimeout(() => {

        element.textContent =
            formatNumber(value);


        element.style.transform =
            "scale(1)";

        element.style.opacity =
            "1";

    }, 160);

}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderCodes() {

    const tbody =
        document.getElementById("codesTableBody");


    if (!tbody) return;


    if (!walletCodes.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="table-message">

                        <i class="bi bi-wallet2"></i>

                        لا توجد أكواد شحن حتى الآن

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        walletCodes
            .map((item, index) =>
                createCodeRow(item, index)
            )
            .join("");

}


/* =========================================================
   CREATE TABLE ROW
   ========================================================= */

function createCodeRow(item, index) {

    const status = item.used

        ? `

            <span class="status used">

                <i class="bi bi-check-circle-fill"></i>

                مستهلك

            </span>

        `

        : `

            <span class="status unused">

                <i class="bi bi-hourglass-split"></i>

                غير مستخدم

            </span>

        `;


    return `

        <tr>

            <td>
                ${index + 1}
            </td>


            <td>
                ${item.date}
            </td>


            <td>

                <span class="code">

                    ${item.code}

                </span>

            </td>


            <td>

                <span class="amount">

                    +${formatNumber(item.amount)} ج.م

                </span>

            </td>


            <td>

                ${status}

            </td>

        </tr>

    `;

}


/* =========================================================
   ALERT
   ========================================================= */

let alertTimer = null;


function showAlert(type, icon, message) {

    const wrapper =
        document.getElementById("walletAlert");


    if (!wrapper) return;


    clearTimeout(alertTimer);


    const className =
        type === "success"
            ? "alert-success"
            : "alert-error";


    wrapper.style.display =
        "block";


    wrapper.innerHTML = `

        <div class="wallet-alert ${className}">

            <i class="bi ${icon}"></i>

            <span>
                ${message}
            </span>

        </div>

    `;


    alertTimer =
        setTimeout(() => {

            wrapper.style.opacity =
                "0";


            setTimeout(() => {

                wrapper.style.display =
                    "none";

                wrapper.style.opacity =
                    "1";

            }, 350);

        }, 5000);

}


/* =========================================================
   GENERATE DEMO CODE
   ========================================================= */


async function generateWalletCode() {

    const amountInput =
        document.getElementById("chargeAmount");

    const quantityInput =
        document.getElementById("codeQuantity");

    const button =
        document.getElementById("generateCodeButton");


    const amount =
        Number(amountInput.value);

    const quantity =
        Number(quantityInput ? quantityInput.value : 1) || 1;


    /* VALIDATION — AMOUNT */

    if (!Number.isFinite(amount) || amount <= 0) {

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "يرجى إدخال قيمة صحيحة أكبر من صفر."
        );

        amountInput.focus();

        return;

    }


    if (!Number.isInteger(amount)) {

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "قيمة الكود يجب أن تكون رقمًا صحيحًا."
        );

        amountInput.focus();

        return;

    }


    /* VALIDATION — QUANTITY */

    if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 1000
    ) {

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "يرجى إدخال عدد أكواد صحيح بين 1 و 1000."
        );

        if (quantityInput) {

            quantityInput.focus();

        }

        return;

    }


    /* BUTTON LOADING */

    button.disabled = true;


    button.innerHTML = `

        <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true">
        </span>

        <span>
            جارٍ إنشاء الأكواد...
        </span>

    `;


    try {

        /* CREATE FORM DATA */

        const formData = new FormData();

        formData.append("balance", amount);
        formData.append("count", quantity);


        /* CALL API */

        const response = await apiRequest(
            "/Code/add-codes",
            {
                method: "POST",
                body: formData
            }
        );


        /* HANDLE UNAUTHORIZED */

        if (response.status === 401) {

            const refreshed = await refreshToken();

            if (!refreshed) {

                window.location.href = "login.html";

                return;

            }


            const retryResponse = await apiRequest(
                "/api/Code/add-codes",
                {
                    method: "POST",
                    body: formData
                }
            );


            if (!retryResponse.ok) {

                throw new Error(
                    `API Error: ${retryResponse.status}`
                );

            }


            var apiCodes =
                await retryResponse.json();

        }
        else {

            if (!response.ok) {

                throw new Error(
                    `API Error: ${response.status}`
                );

            }


            var apiCodes =
                await response.json();

        }


        /* MAP API RESPONSE */

        const generatedCodes =
            apiCodes.map(item => ({

                code: item.code ?? item.Code,

                amount: item.amount ?? item.Amount,

                used: item.isUsed ?? item.IsUsed ?? false,

                date:
                    new Date(
                        item.createdAt ?? item.CreatedAt
                    ).toLocaleDateString("EG")
                    + " - "
                    +
                    new Date(
                        item.createdAt ?? item.CreatedAt
                    ).toLocaleTimeString(
                        "EG",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )

            }));


        /* ADD CODES */

        walletCodes = [
            ...generatedCodes,
            ...walletCodes
        ];


        /* UPDATE UI */

        renderCodes();

        updateSummary();


        /* CLEAR INPUTS */

        amountInput.value = "";

        if (quantityInput) {

            quantityInput.value = "1";

        }


        /* SUCCESS */

        const successMessage =
            quantity === 1

                ? `

                    تم إنشاء الكود

                    <strong>
                        ${generatedCodes[0].code}
                    </strong>

                    بقيمة

                    <strong>
                        ${formatNumber(amount)} ج.م
                    </strong>

                    بنجاح.

                `

                : `

                    تم إنشاء

                    <strong>
                        ${quantity}
                    </strong>

                    كود بقيمة

                    <strong>
                        ${formatNumber(amount)} ج.م
                    </strong>

                    لكل كود بنجاح.

                `;


        showAlert(
            "success",
            "bi-check-circle-fill",
            successMessage
        );


    }
    catch (error) {

        console.error(
            "Generate Codes Error:",
            error
        );


        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "حدث خطأ أثناء إنشاء الأكواد."
        );

    }
    finally {

        /* RESET BUTTON */

        button.disabled = false;


        button.innerHTML = `

            <i class="bi bi-magic"></i>

            <span>
                إنشاء الأكواد
            </span>

        `;

    }

}




/* =========================================================
   EXPORT TO EXCEL
   ========================================================= */

function exportCodesToExcel() {

    const button =
        document.getElementById("exportExcelButton");


    if (typeof XLSX === "undefined") {

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "تعذر تحميل مكتبة تصدير الإكسل."
        );

        return;

    }


    if (!walletCodes.length) {

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "لا توجد أكواد لتصديرها حاليًا."
        );

        return;

    }


    if (button) {

        button.disabled = true;

    }


    try {

        const rows =
            walletCodes.map((item, index) => ({

                "#": index + 1,

                "التاريخ": item.date,

                "الكود": item.code,

                "القيمة (ج.م)": item.amount,

                "الحالة": item.used ? "مستهلك" : "غير مستخدم"

            }));


        const worksheet =
            XLSX.utils.json_to_sheet(rows);


        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 20 },
            { wch: 16 },
            { wch: 14 },
            { wch: 14 }
        ];


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "أكواد الشحن"
        );


        const now =
            new Date();

        const fileName =
            `wallet-codes-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.xlsx`;


        XLSX.writeFile(workbook, fileName);


        showAlert(
            "success",
            "bi-check-circle-fill",
            "تم تصدير ملف الإكسل بنجاح."
        );

    } catch (error) {

        console.error("Export Excel error:", error);

        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "حدث خطأ أثناء تصدير ملف الإكسل."
        );

    } finally {

        if (button) {

            button.disabled = false;

        }

    }

}


/* =========================================================
   FORM
   ========================================================= */

function setupForm() {

    const input =
        document.getElementById("chargeAmount");


    const button =
        document.getElementById("generateCodeButton");


    const exportButton =
        document.getElementById("exportExcelButton");


    if (button) {

        button.addEventListener(
            "click",
            generateWalletCode
        );

    }


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportCodesToExcel
        );

    }


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    generateWalletCode();

                }

            }
        );

    }

}


/* =========================================================
   REVEAL ANIMATION
   ========================================================= */

function setupReveal() {

    const elements =
        document.querySelectorAll(
            "[data-reveal]"
        );


    if (
        !("IntersectionObserver" in window)
    ) {

        elements.forEach(element => {

            element.classList.add(
                "visible"
            );

        });

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );


                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.08
            }
        );


    elements.forEach(element => {

        observer.observe(element);

    });

}
async function loadCodes() {

    try {

        const response = await apiRequest(
            "/Code/get-codes",
            {
                method: "GET"
            }
        );


        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );

        }


        const apiCodes =
            await response.json();


        walletCodes =
            apiCodes.map(item => {

                const createdAt =
                    item.createdAt ?? item.CreatedAt;

                return {

                    code:
                        item.code ??
                        item.Code,

                    amount:
                        item.amount ??
                        item.Amount,

                    used:
                        item.isUsed ??
                        item.IsUsed ??
                        false,

                    date:
                        new Date(createdAt)
                            .toLocaleDateString("EG")
                        + " - "
                        +
                        new Date(createdAt)
                            .toLocaleTimeString(
                                "EG",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            )
                };

            });


        renderCodes();

        updateSummary();

    }
    catch (error) {

        console.error(
            "Get Codes Error:",
            error
        );


        walletCodes = [];

        renderCodes();

        updateSummary();


        showAlert(
            "error",
            "bi-exclamation-triangle-fill",
            "حدث خطأ أثناء تحميل أكواد الشحن."
        );

    }
}



/* =========================================================
   INITIALIZE
   ========================================================= */

// document.addEventListener(
//     "DOMContentLoaded",
//     () => {

//         setupForm();

//         setupReveal();
//         await loadCodes()

//         renderCodes();

//         updateSummary();

//     }
// );
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupForm();

        setupReveal();

        await loadCodes();

    }
);