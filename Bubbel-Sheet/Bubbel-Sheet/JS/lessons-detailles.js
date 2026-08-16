/* =========================================================
LESSON DETAILS PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    const refreshed = await refreshToken();

    if (!refreshed) {
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);

    lessonId = Number(params.get("lessonId"));
    subjectId = Number(params.get("subjectId"));

    if (!lessonId || !subjectId) {

        console.error("Invalid Parameters");

        return;
    }

    await loadLessonDetails();

    setupPurchaseModal();
});


/* =========================================================
API
========================================================= */

const LESSON_DETAILS_API = "/Lessons/Get-Lesson-Details";
const BUY_SUBJECT_API = "/Subject/buy";
const CREATE_RANDOM_EXAM_API = "/Exam/Create-Random-Exam";


/* =========================================================
GLOBAL DATA
========================================================= */

let lessonId = 0;
let subjectId = 0;
let lessonData = null;


/*
    Purchase context

    bank:
    شراء المادة لفتح بنك الأسئلة

    exam:
    شراء المادة لإنشاء امتحان جديد
*/

let purchaseContext = "bank";


/* =========================================================
LOAD DATA
========================================================= */

async function loadLessonDetails() {

    try {

        const response =
            await apiRequest(
                `${LESSON_DETAILS_API}?lessonId=${lessonId}`,
                {
                    method: "GET"
                }
            );


        console.log(
            "Lesson Details Response:",
            response
        );


        if (!response.ok) {

            console.error(
                await response.text()
            );

            return;
        }


        lessonData =
            await response.json();


        console.log(
            "Lesson Details:",
            lessonData
        );


        renderLessonInfo();

        renderPdfSection();

        renderQuestionBanksSection();

        renderExamsSection();

    }
    catch (err) {

        console.error(err);

    }

}


/* =========================================================
LESSON INFO
========================================================= */

function renderLessonInfo() {

    setText(
        "subjectName",
        lessonData.subjectName
    );


    setText(
        "lessonNumber",
        lessonData.index
    );


    setText(
        "lessonName",
        lessonData.lessonName
    );


    setText(
        "lessonDescription",
        lessonData.description || ""
    );


    setText(
        "modalSubjectName",
        lessonData.subjectName
    );


    setText(
        "modalSubjectPrice",
        `${lessonData.price} ج.م`
    );

}


/* =========================================================
PDFs
========================================================= */

function renderPdfSection() {

    const section =
        document.getElementById(
            "pdfSection"
        );


    const container =
        document.getElementById(
            "pdfContainer"
        );


    const pdfs =
        (lessonData && lessonData.pdFs) || [];


    if (!pdfs.length) {

        if (section)
            section.style.display = "none";

        return;
    }


    if (section)
        section.style.display = "";


    container.innerHTML =
        pdfs.map(pdfCardHTML).join("");

}


function pdfCardHTML(pdf) {

    const name = escapeHtml(
        pdf.pdfName ?? "ملف PDF"
    );

    const description = escapeHtml(
        pdf.description ?? ""
    );

    const pdfId = pdf.pdfId ?? pdf.pdfID ?? pdf.id ?? null;

    const size =
        pdf.space !== undefined &&
        pdf.space !== null
            ? `${escapeHtml(pdf.space)} MB`
            : "";

    return `
        <div class="ld-card ld-pdf-card">

            <div class="ld-pdf-icon">
                <i class="bi bi-file-earmark-pdf-fill"></i>
            </div>

            <div class="ld-pdf-info">

                <h3>${name}</h3>

                <p>${description}</p>

                <span class="ld-pdf-size">
                    <i class="bi bi-hdd-fill"></i>
                    <span>${size}</span>
                </span>

            </div>

            <div class="ld-pdf-actions">

                <button
                    type="button"
                    class="ld-btn ld-btn-primary"
                    onclick="downloadPdf(${pdfId})">

                    <i class="bi bi-download"></i>
                    تحميل

                </button>

            </div>

        </div>
    `;
}


async function downloadPdf(pdfId) {

    if (!pdfId) {
        showToast("معرّف الملف غير موجود", true);
        return;
    }

    try {

        const response = await apiRequest(
            `/Pdf/download-pdf?pdfId=${encodeURIComponent(pdfId)}`,
            {
                method: "GET"
            }
        );

        if (!response.ok) {

            console.error(await response.text());

            showToast("تعذر تحميل الملف", true);

            return;
        }

        const data = await response.json();

        if (!data.url) {

            showToast("رابط التحميل غير موجود", true);

            return;
        }

        const link = document.createElement("a");

        link.href = data.url;
        link.target = "_blank";

        document.body.appendChild(link);

        link.click();

        link.remove();

    } catch (error) {

        console.error(error);

        showToast("حدث خطأ أثناء تحميل الملف", true);
    }
}

/* =========================================================
QUESTION BANKS
========================================================= */

function renderQuestionBanksSection() {

    const section =
        document.getElementById(
            "freeBankSection"
        );


    const container =
        document.getElementById(
            "questionBanksContainer"
        );


    const banks =
        (lessonData && lessonData.questionBanks) || [];


    if (!banks.length) {

        if (section)
            section.style.display = "none";

        return;
    }


    if (section)
        section.style.display = "";


    container.innerHTML =
        banks.map(bankCardHTML).join("");


    /* =========================
       OPEN BANK
    ========================= */

    container
        .querySelectorAll("[data-bank-open]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    const bankId =
                        this.getAttribute(
                            "data-bank-open"
                        );


                    if (!bankId)
                        return;


                    window.location.href =
                        `quetion_bank.html?bankId=${encodeURIComponent(bankId)}&subjectId=${encodeURIComponent(subjectId)}`;

                }
            );

        });


    /* =========================
       PURCHASE BANK
    ========================= */

    container
        .querySelectorAll("[data-bank-purchase]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    purchaseContext = "bank";

                    openPurchaseModal();

                }
            );

        });

}


/* =========================================================
BANK CARD
========================================================= */

function bankCardHTML(bank) {

    const isFree =
        !!bank.isFree;


    const name =
        escapeHtml(
            bank.bankName ?? "بنك الأسئلة"
        );


    const qCount =
        bank.qCount ?? 0;


    const bankId =
        escapeAttr(
            bank.bankId
        );


    /* =========================
       FREE BANK
    ========================= */

    if (isFree) {

        return `
        <div class="col-md-6">

            <div class="ld-card ld-content-card h-100">

                <div class="ld-content-top">

                    <div class="ld-icon-wrap ld-icon-free">
                        <i class="bi bi-patch-question-fill"></i>
                    </div>

                    <span class="ld-badge ld-badge-free">
                        مجاني
                    </span>

                </div>

                <h3>${name}</h3>

                <p>بنك أسئلة مجاني</p>

                <div class="ld-content-meta">

                    <span>
                        <i class="bi bi-list-check"></i>
                        ${qCount} سؤال
                    </span>

                </div>

                <button
                    class="ld-btn ld-btn-primary w-100"
                    data-bank-open="${bankId}">

                    <i class="bi bi-play-fill"></i>
                    فتح البنك

                </button>

            </div>

        </div>
        `;

    }


    /* =========================
       PAID BANK - UNLOCKED
    ========================= */

    const unlocked =
        !!(
            lessonData &&
            lessonData.paid
        );


    if (unlocked) {

        return `
        <div class="col-md-6">

            <div class="ld-card ld-content-card h-100">

                <div class="ld-content-top">

                    <div class="ld-icon-wrap ld-icon-paid">
                        <i class="bi bi-patch-question-fill"></i>
                    </div>

                    <span class="ld-badge ld-badge-unlocked">

                        <i class="bi bi-unlock-fill"></i>
                        متاح

                    </span>

                </div>

                <h3>${name}</h3>

                <p>بنك الأسئلة الكامل</p>

                <div class="ld-content-meta">

                    <span>

                        <i class="bi bi-list-check"></i>
                        ${qCount} سؤال

                    </span>

                </div>

                <button
                    class="ld-btn ld-btn-primary w-100"
                    data-bank-open="${bankId}">

                    <i class="bi bi-play-fill"></i>
                    فتح بنك الأسئلة

                </button>

            </div>

        </div>
        `;

    }


    /* =========================
       PAID BANK - LOCKED
    ========================= */

    const price =
        (
            lessonData &&
            lessonData.price !== undefined
        )
            ? lessonData.price
            : "";


    return `
        <div class="col-md-6">

            <div class="ld-card ld-content-card h-100 is-locked">

                <div class="ld-locked-wrap">

                    <div class="ld-locked-content">

                        <div class="ld-content-top">

                            <div class="ld-icon-wrap ld-icon-paid">

                                <i class="bi bi-patch-question-fill"></i>

                            </div>

                            <span class="ld-badge ld-badge-locked">

                                <i class="bi bi-lock-fill"></i>
                                يتطلب شراء المادة

                            </span>

                        </div>

                        <h3>${name}</h3>

                        <p>
                            بنك أسئلة شامل بجميع مستويات
                            الصعوبة مع الإجابات النموذجية
                        </p>

                        <div class="ld-content-meta">

                            <span>

                                <i class="bi bi-list-check"></i>
                                ${qCount} سؤال

                            </span>

                        </div>

                    </div>


                    <div
                        class="ld-lock-overlay"
                        aria-hidden="true">

                        <div class="ld-lock-chain-wrap">

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <div class="ld-lock-circle">

                                <i class="bi bi-lock-fill"></i>

                            </div>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                        </div>

                        <span class="ld-lock-text">
                            محتوى مقفول
                        </span>

                    </div>

                </div>


                <button
                    class="ld-btn ld-btn-locked w-100"
                    data-bank-purchase="1">

                    <i class="bi bi-lock-fill"></i>

                    <span>
                        شراء المادة لفتح المحتوى
                        (<span>${price}</span> ج.م)
                    </span>

                </button>

            </div>

        </div>
    `;

}


/* =========================================================
EXAMS
========================================================= */

function renderExamsSection() {

    const section =
        document.getElementById(
            "examsSection"
        );


    const container =
        document.getElementById(
            "examsContainer"
        );


    const exams =
        (lessonData && lessonData.exams) || [];


    if (!exams.length) {

        if (section)
            section.style.display = "none";

        return;
    }


    if (section)
        section.style.display = "";


    container.innerHTML =
        exams.map(examCardHTML).join("");


    /* =========================
       START FREE EXAM
    ========================= */

    container
        .querySelectorAll("[data-exam-start]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    const examId =
                        this.getAttribute(
                            "data-exam-start"
                        );


                    if (!examId)
                        return;


                    window.location.href =
                        `exam.html?examId=${encodeURIComponent(examId)}&subjectId=${encodeURIComponent(subjectId)}`;

                }
            );

        });


    /* =========================
       REVIEW OLD EXAM
       NEW REVIEW PAGE
    ========================= */

    container
        .querySelectorAll("[data-exam-review]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    const examId =
                        this.getAttribute(
                            "data-exam-review"
                        );


                    if (!examId)
                        return;


                    /*
                        مهم:
                        المراجعة أصبحت صفحة منفصلة
                        عن صفحة حل الامتحان.

                        OLD:
                        exam.html?...&mode=review

                        NEW:
                        review-exam.html?examId=...
                    */

                    window.location.href =
                        `review-exam.html?examId=${encodeURIComponent(examId)}&subjectId=${encodeURIComponent(subjectId)}`;

                }
            );

        });


    /* =========================
       PURCHASE NEW EXAM
    ========================= */

    container
        .querySelectorAll("[data-exam-purchase]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    purchaseContext = "exam";

                    openPurchaseModal();

                }
            );

        });


    /* =========================
       CREATE RANDOM EXAM
    ========================= */

    container
        .querySelectorAll("[data-exam-create]")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                createRandomExam
            );

        });

}


/* =========================================================
EXAM CARD
========================================================= */

function examCardHTML(exam) {

    const name =
        escapeHtml(
            exam.examName ?? "امتحان"
        );


    const description =
        escapeHtml(
            exam.description ?? ""
        );


    const qCount =
        exam.qCount ?? 0;


    const examId =
        escapeAttr(
            exam.examId
        );


    /* =====================================================
       HAS ONE FREE ATTEMPT
    ===================================================== */

    const hasFreeAttempt =
        exam.hasOneFree === true;


    if (hasFreeAttempt) {

        return `
            <div class="col-md-6">

                <div class="ld-card ld-content-card h-100">

                    <div class="ld-content-top">

                        <div class="ld-icon-wrap ld-icon-free">

                            <i class="bi bi-clipboard2-check-fill"></i>

                        </div>

                        <span class="ld-badge ld-badge-free">

                            محاولة مجانية

                        </span>

                    </div>


                    <h3>${name}</h3>

                    <p>${description}</p>


                    <div class="ld-content-meta">

                        <span>

                            <i class="bi bi-list-check"></i>
                            ${qCount} أسئلة

                        </span>

                    </div>


                    <button
                        class="ld-btn ld-btn-primary w-100"
                        data-exam-start="${examId}">

                        <i class="bi bi-play-fill"></i>
                        ابدأ الامتحان

                    </button>

                </div>

            </div>
        `;

    }


    /* =====================================================
       FREE ATTEMPT FINISHED
       BUT SUBJECT IS ALREADY PAID
    ===================================================== */

    if (
        lessonData &&
        lessonData.paid === true
    ) {

        return `
            <div class="col-md-6">

                <div class="ld-card ld-content-card h-100">

                    <div class="ld-content-top">

                        <div class="ld-icon-wrap ld-icon-paid">

                            <i class="bi bi-clipboard2-check-fill"></i>

                        </div>

                        <span class="ld-badge ld-badge-unlocked">

                            <i class="bi bi-unlock-fill"></i>
                            متاح

                        </span>

                    </div>


                    <h3>${name}</h3>

                    <p>${description}</p>


                    <div class="ld-content-meta">

                        <span>

                            <i class="bi bi-list-check"></i>
                            ${qCount} أسئلة

                        </span>

                    </div>


                    <!-- إنشاء امتحان جديد -->

                    <button
                        class="ld-btn ld-btn-primary w-100"
                        data-exam-create="${examId}">

                        <i class="bi bi-plus-circle-fill"></i>
                        إنشاء امتحان جديد

                    </button>


                    <!-- مراجعة الإجابات -->

                    <button
                        class="ld-btn ld-btn-primary w-100"
                        data-exam-review="${examId}">

                        <i class="bi bi-eye-fill"></i>
                        عرض الإجابات

                    </button>

                </div>

            </div>
        `;

    }


    /* =====================================================
       FREE ATTEMPT FINISHED
       SUBJECT NOT PAID

       LOCKED
    ===================================================== */

    const price =
        (
            lessonData &&
            lessonData.price !== undefined
        )
            ? lessonData.price
            : "";


    return `
        <div class="col-md-6">

            <div class="ld-card ld-content-card h-100 is-locked">

                <div class="ld-locked-wrap">

                    <div class="ld-locked-content">

                        <div class="ld-content-top">

                            <div class="ld-icon-wrap ld-icon-paid">

                                <i class="bi bi-clipboard2-check-fill"></i>

                            </div>


                            <span class="ld-badge ld-badge-locked">

                                <i class="bi bi-lock-fill"></i>
                                محاولة مجانية منتهية

                            </span>

                        </div>


                        <h3>${name}</h3>

                        <p>${description}</p>


                        <div class="ld-content-meta">

                            <span>

                                <i class="bi bi-list-check"></i>
                                ${qCount} أسئلة

                            </span>

                        </div>

                    </div>


                    <div
                        class="ld-lock-overlay"
                        aria-hidden="true">

                        <div class="ld-lock-chain-wrap">

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <div class="ld-lock-circle">

                                <i class="bi bi-lock-fill"></i>

                            </div>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                            <span class="ld-chain-link">
                                <i class="bi bi-link-45deg"></i>
                            </span>

                        </div>

                        <span class="ld-lock-text">
                            محتوى مقفول
                        </span>

                    </div>

                </div>


                <!-- شراء المادة -->

                <button
                    class="ld-btn ld-btn-locked w-100"
                    data-exam-purchase="1">

                    <i class="bi bi-lock-fill"></i>

                    <span>
                        شراء المادة لإنشاء امتحان جديد
                        (<span>${price}</span> ج.م)
                    </span>

                </button>


                <!--
                    المراجعة متاحة حتى لو المادة
                    غير مشتراة، طالما الإجابات موجودة.
                -->

                <button
                    class="ld-btn ld-btn-primary w-100"
                    data-exam-review="${examId}">

                    <i class="bi bi-eye-fill"></i>
                    عرض الإجابات

                </button>

            </div>

        </div>
    `;

}


/* =========================================================
CREATE RANDOM EXAM
========================================================= */

async function createRandomExam() {

    const buttons =
        document.querySelectorAll(
            "[data-exam-create]"
        );


    buttons.forEach(function (btn) {

        btn.disabled = true;

        btn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            جاري إنشاء الامتحان...
        `;

    });


    try {

        const response =
            await apiRequest(
                `${CREATE_RANDOM_EXAM_API}?LessonId=${lessonId}`,
                {
                    method: "POST"
                }
            );


        console.log(
            "Random Exam Response:",
            response
        );


        if (!response.ok) {

            let message =
                "حدث خطأ أثناء إنشاء الامتحان";


            try {

                const errorBody =
                    await response.json();


                if (
                    errorBody &&
                    errorBody.message
                ) {

                    message =
                        errorBody.message;

                }

            }
            catch (err) {

                // Keep default message

            }


            if (response.status === 401) {

                message =
                    "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى";

            }


            showToast(message);

            return;
        }


        const randomExam =
            await response.json();


        console.log(
            "Random Exam:",
            randomExam
        );


        /*
            الـ endpoint بيرجع GetExam مباشرة.

            نبحث عن ExamId بأكثر من شكل
            لتجنب اختلاف الـ JSON naming.
        */

        const newExamId =
            randomExam?.examId ??
            randomExam?.examID ??
            randomExam?.ExamId ??
            randomExam?.ExamID ??
            randomExam?.id ??
            randomExam?.Id;


        if (!newExamId) {

            console.error(
                "Random exam response does not contain examId",
                randomExam
            );


            showToast(
                "تم إنشاء الامتحان ولكن لم يتم العثور على رقم الامتحان"
            );


            return;
        }


        /*
            الامتحان الجديد يفتح دائمًا
            في صفحة الحل وليس المراجعة.
        */

        window.location.href =
            `exam.html?examId=${encodeURIComponent(newExamId)}&subjectId=${encodeURIComponent(subjectId)}`;

    }
    catch (error) {

        console.error(
            "Create Random Exam Error:",
            error
        );


        showToast(
            "حدث خطأ أثناء إنشاء الامتحان"
        );

    }
    finally {

        buttons.forEach(function (btn) {

            btn.disabled = false;

            btn.innerHTML = `
                <i class="bi bi-plus-circle-fill"></i>
                إنشاء امتحان جديد
            `;

        });

    }

}


/* =========================================================
BUY SUBJECT
========================================================= */

async function confirmSubjectPurchase() {

    const btn =
        document.getElementById(
            "confirmPurchaseBtn"
        );


    if (!btn)
        return;


    btn.disabled = true;


    btn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        جاري شراء المادة...
    `;


    try {

        const response =
            await apiRequest(
                BUY_SUBJECT_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        subjectId: subjectId
                    })
                }
            );


        if (!response.ok) {

            let message =
                "حدث خطأ أثناء شراء المادة";


            try {

                const errorBody =
                    await response.json();


                if (
                    errorBody &&
                    errorBody.message
                ) {

                    message =
                        errorBody.message;

                }

            }
            catch (parseErr) {

                // Keep generic message

            }


            if (response.status === 401) {

                message =
                    "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى";

            }


            showToast(message);

            return;
        }


        /*
            شراء المادة نجح.

            هذا يجعل:
            - بنك الأسئلة المدفوع = متاح
            - الامتحان بعد انتهاء المحاولة المجانية = متاح
        */

        lessonData.paid = true;


        /*
            تحديث الرصيد المحلي
        */

        const currentBalance =
            getCurrentBalance();


        const price =
            Number(
                lessonData.price
            ) || 0;


        const newBalance =
            currentBalance - price;


        if (newBalance >= 0) {

            localStorage.setItem(
                "blanced",
                String(newBalance)
            );


            if (
                typeof setNavbarWalletBalance ===
                "function"
            ) {

                setNavbarWalletBalance(
                    newBalance
                );

            }

        }


        /*
            إعادة رسم المحتوى
        */

        renderQuestionBanksSection();

        renderExamsSection();


        closePurchaseModal();


        showToast(
            "تم شراء المادة بنجاح"
        );

    }
    catch (e) {

        console.error(e);


        showToast(
            "حدث خطأ أثناء شراء المادة"
        );

    }
    finally {

        btn.disabled = false;


        btn.innerHTML = `
            <i class="bi bi-check2"></i>
            تأكيد شراء المادة
        `;

    }

}


/* =========================================================
PURCHASE MODAL
========================================================= */

function setupPurchaseModal() {

    document
        .getElementById("purchaseModalClose")
        ?.addEventListener(
            "click",
            closePurchaseModal
        );


    document
        .getElementById("cancelPurchaseBtn")
        ?.addEventListener(
            "click",
            closePurchaseModal
        );


    document
        .getElementById("purchaseModalOverlay")
        ?.addEventListener(
            "click",
            function (e) {

                if (e.target === this) {

                    closePurchaseModal();

                }

            }
        );


    document
        .getElementById("confirmPurchaseBtn")
        ?.addEventListener(
            "click",
            confirmSubjectPurchase
        );

}


/* =========================================================
OPEN PURCHASE MODAL
========================================================= */

function openPurchaseModal() {

    const overlay =
        document.getElementById(
            "purchaseModalOverlay"
        );


    if (!overlay)
        return;


    const price =
        Number(
            lessonData?.price
        ) || 0;


    const currentBalance =
        getCurrentBalance();


    const balanceAfter =
        currentBalance - price;


    setText(
        "modalSubjectName",
        lessonData?.subjectName || ""
    );


    setText(
        "modalSubjectPrice",
        `${price} ج.م`
    );


    setText(
        "modalCurrentBalance",
        `${formatMoney(currentBalance)} ج.م`
    );


    setText(
        "modalBalanceAfter",
        `${formatMoney(balanceAfter)} ج.م`
    );


    const insufficientMsg =
        document.getElementById(
            "modalInsufficientMsg"
        );


    const confirmBtn =
        document.getElementById(
            "confirmPurchaseBtn"
        );


    const rechargeBtn =
        document.getElementById(
            "rechargeBtn"
        );


    if (balanceAfter < 0) {

        if (insufficientMsg) {

            insufficientMsg.style.display =
                "";

            insufficientMsg.textContent =
                "رصيدك غير كافٍ لشراء المادة.";

        }


        if (confirmBtn) {

            confirmBtn.style.display =
                "none";

        }


        if (rechargeBtn) {

            rechargeBtn.style.display =
                "";

        }

    }
    else {

        if (insufficientMsg) {

            insufficientMsg.style.display =
                "none";

        }


        if (confirmBtn) {

            confirmBtn.style.display =
                "";

        }


        if (rechargeBtn) {

            rechargeBtn.style.display =
                "none";

        }

    }


    overlay.classList.add("show");

    document.body.style.overflow =
        "hidden";

}


/* =========================================================
CLOSE PURCHASE MODAL
========================================================= */

function closePurchaseModal() {

    const overlay =
        document.getElementById(
            "purchaseModalOverlay"
        );


    if (!overlay)
        return;


    overlay.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
GET CURRENT BALANCE
========================================================= */

function getCurrentBalance() {

    const storedBalance =
        localStorage.getItem(
            "blanced"
        );


    if (
        storedBalance === null ||
        storedBalance === ""
    ) {

        return 0;

    }


    const balance =
        Number(
            storedBalance
        );


    if (
        Number.isNaN(balance)
    ) {

        return 0;

    }


    return balance;

}


/* =========================================================
FORMAT MONEY
========================================================= */

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-US"
    );

}


/* =========================================================
TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "ldToast"
        );


    if (!toast)
        return;


    clearTimeout(
        toastTimer
    );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            1800
        );

}


/* =========================================================
HELPERS
========================================================= */

function setText(id, value) {

    const el =
        document.getElementById(
            id
        );


    if (el) {

        el.textContent =
            value ?? "";

    }

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttr(value) {

    return escapeHtml(
        value
    );

}