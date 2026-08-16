/* =========================================================
TEACHER LESSON DETAILS PAGE
Built on top of the exact same GET flow used by the student
Lesson Details page (LESSON_DETAILS_API). Purchase / lock /
free-attempt logic has been removed entirely — the teacher
already has full access. Add/Delete endpoints that were not
present in the student page are NOT invented — see CONFIG.
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
});

/* =========================================================
API — CONFIG
========================================================= */

// ✅ Confirmed working — same GET endpoint used by the student page,
// same response shape. Nothing about this call was changed.
const LESSON_DETAILS_API = "/Lessons/Get-Lesson-Details";

// ⚠️ NOT CONFIRMED — none of these had a matching endpoint in the files
// you shared, so nothing is invented here. Fill in { url, method } once
// you have the real routes/request bodies and every action below starts
// working immediately, no other code changes needed.
const ADD_PDF_API = "/Pdf/add-pdf";
const DELETE_PDF_API = "/Pdf/remove-pdf";
const ADD_BANK_API = "/QuestionBank/add-questionBank";
const EDIT_BANK_API = "/QuestionBank/edit-QuestionBank";
const DELETE_BANK_API = "/QuestionBank/delete-questionBank"; // e.g. "/QuestionBank/delete-questionBank" — fill in once confirmed
const TOGGLE_BANK_STATUS_API = "/QuestionBank/make-toggle";
const ADD_EXAM_API = "/Exam/create-exam";
const EDIT_EXAM_API = "/Exam/edit-exam";
const DELETE_EXAM_API = "/Exam/delete-exam"; // e.g. "/Exam/delete-exam" — fill in once confirmed
const EXAM_PAID_SETTINGS_API = "/Lessons/edit-random-values"; // POST/PUT endpoint to SAVE questionCount + duration — fill in once confirmed

// ✅ Confirmed working (via curl) — GET endpoint that returns the current
// paid-exam attempt settings for a lesson: { id, lessonId, lesson,
// questionCount, duration: "HH:MM:SS" }. Query param is "Id", not "lessonId".
const Get_SETTINGS_Lesson_API = "/Lessons/get-random-values";

// Page the "إدارة أسئلة البنك" button navigates to. Defaults to the same
// bankId/subjectId query-param pattern already used by the student
// page's "فتح البنك" button. Point this at the real teacher
// question-management page once you tell me its filename.
const MANAGE_BANK_PAGE = "add-quetion-bank.html";
// Page the "إدارة أسئلة الامتحان" button navigates to — same
// examId/lessonId query-param pattern as MANAGE_BANK_PAGE above.
// Set to "add-exam.html" (your teacher exam-questions page); change
// this one line if the actual filename is different.
const MANAGE_EXAM_PAGE = "add-exam.html";

/* =========================================================
GLOBAL DATA
========================================================= */

let lessonId = 0;
let subjectId = 0;
let lessonData = null;
let pendingDeletePdfId = null;
let pendingDeleteBankId = null;
let pendingEditBankId = null;
let pendingDeleteExamId = null;
let pendingEditExamId = null;

/* =========================================================
LOAD DATA
========================================================= */

async function loadLessonDetails() {
    try {
        const response = await apiRequest(
            `${LESSON_DETAILS_API}?lessonId=${lessonId}&IsStudent=true`,
            {
                method: "GET",
            },
        );

        console.log("Lesson Details Response:", response);

        if (!response.ok) {
            console.error(await response.text());

            showToast("تعذر تحميل بيانات الدرس", true);

            return;
        }

        lessonData = await response.json();

        console.log("Lesson Details:", lessonData);

        renderLessonInfo();

        renderPdfSection();

        renderQuestionBanksSection();

        renderExamsSection();
    } catch (err) {
        console.error(err);

        showToast("حدث خطأ أثناء تحميل بيانات الدرس", true);
    }
}

/* =========================================================
LESSON INFO
(unchanged — same fields, same API, as the student page)
========================================================= */

function renderLessonInfo() {
    setText("subjectName", lessonData.subjectName);

    setText("lessonNumber", lessonData.index);

    setText("lessonName", lessonData.lessonName);

    setText("lessonDescription", lessonData.description || "");
}

/* =========================================================
PDFs
========================================================= */

function renderPdfSection() {
    const section = document.getElementById("pdfSection");

    const container = document.getElementById("pdfContainer");

    const pdfs = (lessonData && lessonData.pdFs) || [];

    if (!section || !container) return;

    section.style.display = "";

    if (!pdfs.length) {
        container.innerHTML = emptyStateHTML(
            "bi-file-earmark-pdf",
            "لا توجد ملفات PDF بعد",
            "أضف أول ملف لهذا الدرس.",
            "openAddPdfModal()",
            "+ إضافة ملف PDF",
        );

        return;
    }

    container.innerHTML = pdfs.map(pdfCardHTML).join("");
}

function pdfCardHTML(pdf) {
    const name = escapeHtml(pdf.pdfName ?? "ملف PDF");

    const description = escapeHtml(pdf.description ?? "");

    const size =
        pdf.space !== undefined && pdf.space !== null
            ? `${escapeHtml(pdf.space)} MB`
            : "";

    const link = pdf.pdfLink ? escapeAttr(pdf.pdfLink) : "#";

    // The student page's GET response never needed to expose a PDF ID
    // (there's no delete there), so the exact property name isn't
    // confirmed. Trying the common naming patterns already used
    // elsewhere in this API (lessonId / bankId / examId → pdfId).
    // Update this if the real field turns out to be different.
    const pdfId = pdf.pdfId ?? pdf.pdfID ?? pdf.id ?? null;

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

                <button
                    class="ld-icon-btn ld-icon-delete"
                    type="button"
                    title="حذف الملف"
                    aria-label="حذف الملف"
                    onclick="openDeletePdfModal(${pdfId})">

                    <i class="bi bi-trash3"></i>

                </button>

            </div>

        </div>
    `;
}

/* =========================================================
ADD PDF
========================================================= */

function openAddPdfModal() {
    const form = document.getElementById("addPdfForm");

    if (form) form.reset();

    openModal("addPdfModalOverlay");
}

async function submitAddPdf(event) {
    event.preventDefault();

    if (!ADD_PDF_API) {
        showToast(
            "لم يتم تحديد endpoint لإضافة ملف PDF بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    const name = document.getElementById("addPdfName").value.trim();

    const description = document.getElementById("addPdfDesc").value.trim();

    const fileInput = document.getElementById("addPdfFile");

    const file = fileInput.files && fileInput.files[0];

    if (!name || !file) {
        showToast("اسم الملف والملف نفسه مطلوبان", true);
        return;
    }

    const submitBtn = document.getElementById("addPdfSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const formData = new FormData();
        formData.append("LessonID", lessonId);
        formData.append("Name", name);
        formData.append("Description", description);
        formData.append("File", file);

        const response = await apiRequest(ADD_PDF_API, {
        method: "POST",
        body: formData,
    });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذرت إضافة الملف", true);
            return;
        }

        showToast("تمت إضافة الملف بنجاح");
        closeModal("addPdfModalOverlay");
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء إضافة الملف", true);
    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
DELETE PDF
========================================================= */

function openDeletePdfModal(pdfId) {
    if (!pdfId) {
        console.error("Invalid PDF Id");
        showToast("تعذر تحديد الملف المطلوب حذفه", true);
        return;
    }

    pendingDeletePdfId = pdfId;
    openModal("deletePdfModalOverlay");
}

async function confirmDeletePdf() {
    if (!DELETE_PDF_API) {
        showToast(
            "لم يتم تحديد endpoint لحذف ملف PDF بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingDeletePdfId) return;

    const confirmBtn = document.getElementById("deletePdfConfirmBtn");

    setBtnLoading(confirmBtn, true);

    try {
        const response = await apiRequest(
            `${DELETE_PDF_API}?PdfId=${pendingDeletePdfId}`,
            {
                method: "POST", //TODO
            },
        );

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حذف الملف", true);
            return;
        }

        showToast("تم حذف الملف بنجاح");
        closeModal("deletePdfModalOverlay");
        pendingDeletePdfId = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء حذف الملف", true);
    } finally {
        setBtnLoading(confirmBtn, false);
    }
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

        // بدء التحميل من Bunny
        const link = document.createElement("a");
        link.href = data.url;
        link.download = "";
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
    const section = document.getElementById("freeBankSection");

    const container = document.getElementById("questionBanksContainer");

    const banks = (lessonData && lessonData.questionBanks) || [];

    if (!section || !container) return;

    section.style.display = "";

    if (!banks.length) {
        container.innerHTML = emptyStateHTML(
            "bi-patch-question",
            "لا توجد بنوك أسئلة بعد",
            "أضف أول بنك أسئلة لهذا الدرس.",
            "openAddBankModal()",
            "+ إضافة بنك أسئلة",
        );

        return;
    }

    container.innerHTML = banks.map(bankCardHTML).join("");
}

function bankCardHTML(bank) {
    const isFree = !!bank.isFree;

    const name = escapeHtml(bank.bankName ?? "بنك الأسئلة");

    // Not rendered anywhere on the student page (it hardcodes its own
    // description text there), so shown only if the API actually
    // includes it — nothing invented if it's missing.
    const description = escapeHtml(bank.description ?? "");

    const qCount = bank.qCount ?? 0;

    const bankId = escapeAttr(bank.bankId);

    // Whether the bank's link is currently reachable by students.
    // Defaults to active unless the API explicitly marks it inactive.
    const isActive = bank.isActive !== false;

    return `
        <div class="col-md-6 col-lg-4">

            <div class="ld-card ld-content-card h-100">

                <div class="ld-content-top">

                    <div class="ld-icon-wrap ${isFree ? "ld-icon-free" : "ld-icon-paid"}">
                        <i class="bi bi-patch-question-fill"></i>
                    </div>

                    <div class="ld-content-top-end">

                        <div class="ld-content-badges">

                            <span class="ld-badge ${isFree ? "ld-badge-free" : "ld-badge-paid"}">
                                ${isFree ? "مجاني" : "مدفوع"}
                            </span>

                            <span class="ld-badge ${isActive ? "ld-badge-active" : "ld-badge-inactive"}">
                                <i class="bi ${isActive ? "bi-unlock-fill" : "bi-lock-fill"}"></i>
                                ${isActive ? "نشط" : "غير نشط"}
                            </span>

                        </div>

                        <div class="ld-content-actions">

                            <button
                                class="ld-icon-btn"
                                type="button"
                                title="تعديل بنك الأسئلة"
                                aria-label="تعديل بنك الأسئلة"
                                onclick="openEditBankModal(${bankId})">

                                <i class="bi bi-pencil-fill"></i>

                            </button>

                            <button
                                class="ld-icon-btn ld-icon-delete"
                                type="button"
                                title="حذف بنك الأسئلة"
                                aria-label="حذف بنك الأسئلة"
                                onclick="openDeleteBankModal(${bankId})">

                                <i class="bi bi-trash3"></i>

                            </button>

                            <button
                                class="ld-icon-btn"
                                type="button"
                                title="${isActive ? "إيقاف الرابط" : "تفعيل الرابط"}"
                                aria-label="${isActive ? "إيقاف الرابط" : "تفعيل الرابط"}"
                                onclick="openToggleBankStatusModal(${bankId}, ${isActive})">

                                <i class="bi ${isActive ? "bi-unlock-fill" : "bi-lock-fill"}"></i>

                            </button>

                        </div>

                    </div>

                </div>

                <h3>${name}</h3>

                ${description ? `<p>${description}</p>` : ""}

                <div class="ld-content-meta">
                    <span>
                        <i class="bi bi-list-check"></i>
                        ${qCount} سؤال
                    </span>
                </div>

                <button
                    class="ld-btn ld-btn-primary ld-manage-btn"
                    type="button"
                    onclick="manageQuestionBank(${bankId})">

                    <i class="bi bi-gear-fill"></i>
                    إدارة أسئلة البنك

                </button>

            </div>

        </div>
    `;
}

function manageQuestionBank(bankId) {
    if (!bankId) {
        console.error("Invalid Bank Id");
        return;
    }

    window.location.href = `${MANAGE_BANK_PAGE}?bankId=${encodeURIComponent(bankId)}&subjectId=${encodeURIComponent(subjectId)}`;
}

/* =========================================================
ADD QUESTION BANK
========================================================= */

function openAddBankModal() {
    const form = document.getElementById("addBankForm");

    if (form) form.reset();

    openModal("addBankModalOverlay");
}

async function submitAddBank(event) {
    event.preventDefault();

    if (!ADD_BANK_API) {
        showToast(
            "لم يتم تحديد endpoint لإضافة بنك الأسئلة بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    const name = document.getElementById("addBankName").value.trim();

    const description = document.getElementById("addBankDesc").value.trim();

    const isFree = document.getElementById("addBankFree").checked;

    if (!name) {
        showToast("اسم بنك الأسئلة مطلوب", true);
        return;
    }

    const submitBtn = document.getElementById("addBankSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const Data = new FormData(); 
        Data.append("LessonId",lessonId);
        Data.append("BankName",name);
        Data.append("Description",description);
        Data.append("IsFree",isFree);
        const response = await apiRequest(ADD_BANK_API, {
            method: "POST",
            body: Data
        });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذرت إضافة بنك الأسئلة", true);
            return;
        }

        showToast("تمت إضافة بنك الأسئلة بنجاح");
        closeModal("addBankModalOverlay");
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء إضافة بنك الأسئلة", true);
    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
EDIT QUESTION BANK
(اسم البنك + الوصف + مجاني/مدفوع فقط)
========================================================= */

function findBankById(bankId) {
    const banks = (lessonData && lessonData.questionBanks) || [];

    return banks.find((b) => String(b.bankId) === String(bankId)) || null;
}

function openEditBankModal(bankId) {
    if (!bankId) {
        console.error("Invalid Bank Id");
        showToast("تعذر تحديد بنك الأسئلة المطلوب تعديله", true);
        return;
    }

    const bank = findBankById(bankId);

    if (!bank) {
        showToast("تعذر العثور على بيانات بنك الأسئلة", true);
        return;
    }

    const form = document.getElementById("editBankForm");

    if (form) form.reset();

    document.getElementById("editBankName").value = bank.bankName ?? "";

    document.getElementById("editBankDesc").value = bank.description ?? "";

    const isFree = !!bank.isFree;

    document.getElementById("editBankFree").checked = isFree;
    document.getElementById("editBankPaid").checked = !isFree;

    pendingEditBankId = bankId;
    openModal("editBankModalOverlay");
}

async function submitEditBank(event) {
    event.preventDefault();

    if (!EDIT_BANK_API) {
        showToast(
            "لم يتم تحديد endpoint لتعديل بنك الأسئلة بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingEditBankId) return;

    const name = document.getElementById("editBankName").value.trim();

    const description = document.getElementById("editBankDesc").value.trim();

    const isFree = document.getElementById("editBankFree").checked;

    if (!name) {
        showToast("اسم بنك الأسئلة مطلوب", true);
        return;
    }

    const submitBtn = document.getElementById("editBankSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const Data = new FormData(); 
        Data.append("QId",pendingEditBankId);
        Data.append("BankName",name);
        Data.append("Description",description);
        Data.append("IsFree",isFree);
        const response = await apiRequest(EDIT_BANK_API, {
            method: "PUT",
            body: Data
        });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حفظ تعديلات بنك الأسئلة", true);
            return;
        }

        showToast("تم تعديل بنك الأسئلة بنجاح");
        closeModal("editBankModalOverlay");
        pendingEditBankId = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تعديل بنك الأسئلة", true);
    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
DELETE QUESTION BANK
========================================================= */

function openDeleteBankModal(bankId) {
    if (!bankId) {
        console.error("Invalid Bank Id");
        showToast("تعذر تحديد بنك الأسئلة المطلوب حذفه", true);
        return;
    }

    pendingDeleteBankId = bankId;
    openModal("deleteBankModalOverlay");
}

async function confirmDeleteBank() {
    if (!DELETE_BANK_API) {
        showToast(
            "لم يتم تحديد endpoint لحذف بنك الأسئلة بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingDeleteBankId) return;

    const confirmBtn = document.getElementById("deleteBankConfirmBtn");

    setBtnLoading(confirmBtn, true);

    try {
        const response = await apiRequest(
            `${DELETE_BANK_API}?Id=${pendingDeleteBankId}`,
            {
                method: "DELETE",
            },
        );

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حذف بنك الأسئلة", true);
            return;
        }

        showToast("تم حذف بنك الأسئلة بنجاح");
        closeModal("deleteBankModalOverlay");
        pendingDeleteBankId = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء حذف بنك الأسئلة", true);
    } finally {
        setBtnLoading(confirmBtn, false);
    }
}

/* =========================================================
TOGGLE QUESTION BANK LINK STATUS (active / not-active)
Shown via a confirm modal rather than toggling instantly.
========================================================= */

let pendingToggleBankId = null;
let pendingToggleBankNextState = null;

function openToggleBankStatusModal(bankId, currentIsActive) {
    if (!bankId) {
        console.error("Invalid Bank Id");
        showToast("تعذر تحديد بنك الأسئلة المطلوب تغيير حالته", true);
        return;
    }

    const nextIsActive = !currentIsActive;

    pendingToggleBankId = bankId;
    pendingToggleBankNextState = nextIsActive;

    const icon = document.querySelector(
        "#toggleBankStatusModalOverlay .ld-modal-icon i",
    );

    if (icon)
        icon.className = nextIsActive ? "bi bi-unlock-fill" : "bi bi-lock-fill";

    setText(
        "toggleBankStatusTitle",
        nextIsActive
            ? "هل تريد تفعيل رابط بنك الأسئلة؟"
            : "هل تريد إيقاف رابط بنك الأسئلة؟",
    );

    const confirmBtnText = document.querySelector(
        "#toggleBankStatusConfirmBtn .ld-btn-text",
    );

    if (confirmBtnText) {
        confirmBtnText.innerHTML = nextIsActive
            ? `<i class="bi bi-unlock-fill"></i> تفعيل الرابط`
            : `<i class="bi bi-lock-fill"></i> إيقاف الرابط`;
    }

    openModal("toggleBankStatusModalOverlay");
}

async function confirmToggleBankStatus() {
    if (!TOGGLE_BANK_STATUS_API) {
        showToast(
            "لم يتم تحديد endpoint لتغيير حالة بنك الأسئلة بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingToggleBankId) return;

    const confirmBtn = document.getElementById("toggleBankStatusConfirmBtn");

    setBtnLoading(confirmBtn, true);

    try {
       const response = await apiRequest(
    `${TOGGLE_BANK_STATUS_API}?Id=${encodeURIComponent(pendingToggleBankId)}`,
    {
        method: "PUT"
    }
);

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر تغيير حالة بنك الأسئلة", true);
            return;
        }

        showToast(
            pendingToggleBankNextState
                ? "تم تفعيل الرابط بنجاح"
                : "تم إيقاف الرابط بنجاح",
        );

        closeModal("toggleBankStatusModalOverlay");
        pendingToggleBankId = null;
        pendingToggleBankNextState = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تغيير حالة بنك الأسئلة", true);
    } finally {
        setBtnLoading(confirmBtn, false);
    }
}

/* =========================================================
EXAMS
========================================================= */

function renderExamsSection() {
    const section = document.getElementById("examsSection");

    const container = document.getElementById("examsContainer");

    const exams = (lessonData && lessonData.exams) || [];

    if (!section || !container) return;

    section.style.display = "";

    if (!exams.length) {
        container.innerHTML = emptyStateHTML(
            "bi-clipboard2-check",
            "لا توجد امتحانات بعد",
            "أضف أول امتحان لهذا الدرس.",
            "openAddExamModal()",
            "+ إضافة امتحان",
        );

        return;
    }

    container.innerHTML = exams.map(examCardHTML).join("");
}

function examCardHTML(exam) {
    const name = escapeHtml(exam.examName ?? "امتحان");

    const description = escapeHtml(exam.description ?? "");

    const qCount = exam.qCount ?? 0;

    // Not used anywhere on the student page, so only shown if the API
    // actually returns it — tries the common property-naming patterns
    // already used elsewhere (qCount, bankName, ...), nothing invented.
    const duration =
        exam.duration ?? exam.examDuration ?? exam.durationMinutes ?? null;

    const examId = escapeAttr(exam.examId);

    return `
        <div class="col-md-6 col-lg-4">

            <div class="ld-card ld-content-card h-100">

                <div class="ld-content-top">

                    <div class="ld-icon-wrap ld-icon-free">
                        <i class="bi bi-clipboard2-check-fill"></i>
                    </div>

                    <div class="ld-content-actions">

                        <button
                            class="ld-icon-btn"
                            type="button"
                            title="تعديل الامتحان"
                            aria-label="تعديل الامتحان"
                            onclick="openEditExamModal(${examId})">

                            <i class="bi bi-pencil-fill"></i>

                        </button>

                        <button
                            class="ld-icon-btn ld-icon-delete"
                            type="button"
                            title="حذف الامتحان"
                            aria-label="حذف الامتحان"
                            onclick="openDeleteExamModal(${examId})">

                            <i class="bi bi-trash3"></i>

                        </button>

                    </div>

                </div>

                <h3>${name}</h3>

                ${description ? `<p>${description}</p>` : ""}

                <div class="ld-content-meta">

                    <span>
                        <i class="bi bi-list-check"></i>
                        ${qCount} سؤال
                    </span>

                    ${duration
            ? `
                    <span>
                        <i class="bi bi-clock-fill"></i>
                        ${escapeHtml(duration)} دقيقة
                    </span>
                    `
            : ""
        }

                </div>

                <button
                    class="ld-btn ld-btn-primary ld-manage-btn"
                    type="button"
                    onclick="manageExam(${examId})">

                    <i class="bi bi-gear-fill"></i>
                    إدارة أسئلة الامتحان

                </button>

            </div>

        </div>
    `;
}

function manageExam(examId) {
    if (!examId) {
        console.error("Invalid Exam Id");
        return;
    }

    window.location.href = `${MANAGE_EXAM_PAGE}?examId=${encodeURIComponent(examId)}&lessonId=${encodeURIComponent(lessonId)}`;
}

/* =========================================================
ADD EXAM
========================================================= */

function openAddExamModal() {
    const form = document.getElementById("addExamForm");

    if (form) form.reset();

    openModal("addExamModalOverlay");
}

async function submitAddExam(event) {
    event.preventDefault();

    if (!ADD_EXAM_API) {
        showToast(
            "لم يتم تحديد endpoint لإضافة الامتحان بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    const name = document.getElementById("addExamName").value.trim();

    const description = document.getElementById("addExamDesc").value.trim();

    const duration = Number(document.getElementById("addExamDuration").value);

    if (!name || !duration) {
        showToast("اسم الامتحان ومدته مطلوبان", true);
        return;
    }

    const submitBtn = document.getElementById("addExamSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        console.log(lessonId)
     const response = await apiRequest(ADD_EXAM_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            LessonId: lessonId,
            ExamName: name,
            Description: description,
            Duration: formatMinutesToDuration(duration)
        })
    });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذرت إضافة الامتحان", true);
            return;
        }

        showToast("تمت إضافة الامتحان بنجاح");
        closeModal("addExamModalOverlay");
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء إضافة الامتحان", true);
    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
EDIT EXAM
(اسم الامتحان + الوصف + المدة فقط)
========================================================= */

function findExamById(examId) {
    const exams = (lessonData && lessonData.exams) || [];

    return exams.find((e) => String(e.examId) === String(examId)) || null;
}

function openEditExamModal(examId) {
    if (!examId) {
        console.error("Invalid Exam Id");
        showToast("تعذر تحديد الامتحان المطلوب تعديله", true);
        return;
    }

    const exam = findExamById(examId);

    if (!exam) {
        showToast("تعذر العثور على بيانات الامتحان", true);
        return;
    }

    const form = document.getElementById("editExamForm");

    if (form) form.reset();

    document.getElementById("editExamName").value = exam.examName ?? "";

    document.getElementById("editExamDesc").value = exam.description ?? "";

    document.getElementById("editExamDuration").value =
        exam.duration ?? exam.examDuration ?? exam.durationMinutes ?? "";

    pendingEditExamId = examId;
    openModal("editExamModalOverlay");
}

async function submitEditExam(event) {
    event.preventDefault();

    if (!EDIT_EXAM_API) {
        showToast(
            "لم يتم تحديد endpoint لتعديل الامتحان بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingEditExamId) return;

    const name = document.getElementById("editExamName").value.trim();

    const description = document.getElementById("editExamDesc").value.trim();

    const duration = Number(document.getElementById("editExamDuration").value);

    if (!name || !duration) {
        showToast("اسم الامتحان ومدته مطلوبان", true);
        return;
    }

    const submitBtn = document.getElementById("editExamSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const response = await apiRequest(EDIT_EXAM_API, {
            method:"PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            ExamId: pendingEditExamId,
            ExamName: name,
            Description: description,
            Duration: formatMinutesToDuration(duration)
            }),
        });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حفظ تعديلات الامتحان", true);
            return;
        }

        showToast("تم تعديل الامتحان بنجاح");
        closeModal("editExamModalOverlay");
        pendingEditExamId = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تعديل الامتحان", true);
    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
DELETE EXAM
========================================================= */

function openDeleteExamModal(examId) {
    if (!examId) {
        console.error("Invalid Exam Id");
        showToast("تعذر تحديد الامتحان المطلوب حذفه", true);
        return;
    }

    pendingDeleteExamId = examId;
    openModal("deleteExamModalOverlay");
}

async function confirmDeleteExam() {
    if (!DELETE_EXAM_API) {
        showToast(
            "لم يتم تحديد endpoint لحذف الامتحان بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    if (!pendingDeleteExamId) return;

    const confirmBtn = document.getElementById("deleteExamConfirmBtn");

    setBtnLoading(confirmBtn, true);

    try {
        const response = await apiRequest(
            `${DELETE_EXAM_API}?Id=${pendingDeleteExamId}`,
            {
                method: "DELETE",
            },
        );

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حذف الامتحان", true);
            return;
        }

        showToast("تم حذف الامتحان بنجاح");
        closeModal("deleteExamModalOverlay");
        pendingDeleteExamId = null;
        await loadLessonDetails();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء حذف الامتحان", true);
    } finally {
        setBtnLoading(confirmBtn, false);
    }
}

/* =========================================================
PAID EXAM ATTEMPTS SETTINGS
(منفصلة عن نموذج إضافة الامتحان — عدد الأسئلة والمدة فقط)
GET  /Lessons/get-random-values?Id=<lessonId>  → { questionCount, duration: "HH:MM:SS" }
SAVE endpoint (EXAM_PAID_SETTINGS_API) not confirmed yet — form still
shows the "endpoint not set" toast on submit until you give me it.
========================================================= */

async function openExamPaidSettingsModal() {
    const form = document.getElementById("examPaidSettingsForm");

    if (form) form.reset();

    openModal("examPaidSettingsModalOverlay");

    await loadLessonSettings();
}

// GET /Lessons/get-random-values?Id=... — fetches the paid-exam attempt
// settings currently saved for this lesson and pre-fills the modal's
// inputs with them (questionCount → count field, duration "HH:MM:SS" →
// minutes in the duration field).
let id = null;

async function loadLessonSettings() {
    const questionsInput = document.getElementById("examPaidQuestionsCount");

    const durationInput = document.getElementById("examPaidDuration");

    const submitBtn = document.getElementById("examPaidSettingsSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const response = await apiRequest(
            `${Get_SETTINGS_Lesson_API}?Id=${encodeURIComponent(lessonId)}`,
            {
                method: "GET"
            }
        );

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر تحميل إعدادات الامتحان المدفوع الحالية", true);
            return;
        }

        const raw = await response.text();

        let settings = {};

        if (raw) {
            try {
                settings = JSON.parse(raw);
            } catch (parseError) {
                console.error("Lesson Settings — invalid JSON:", raw);
            }
        }

        console.log("Lesson Settings:", settings);

        const questionsCount = settings.questionCount ?? null;
        id = settings.id ?? null;
        const duration = parseDurationToMinutes(settings.duration);

        if (questionsInput && questionsCount !== null) {
            questionsInput.value = questionsCount;
        }

        if (durationInput && duration !== null) {
            durationInput.value = duration;
        }

        return settings;

    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل إعدادات الامتحان المدفوع", true);

    } finally {
        setBtnLoading(submitBtn, false);
    }
}

function formatTimeSpan(duration) {
    if (!duration) return "00:00";

    const parts = duration.split(":");

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseDurationToMinutes(duration) {
    if (!duration) return null;

    const parts = duration.split(":");

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    return (hours * 60) + minutes;
}

function formatMinutesToTimeSpan(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:00`;
}

async function submitExamPaidSettings(event) {
    event.preventDefault();

    if (!EXAM_PAID_SETTINGS_API) {
        showToast(
            "لم يتم تحديد endpoint لحفظ إعدادات الامتحان المدفوع بعد — حدّثه في CONFIG أعلى الملف",
            true,
        );

        return;
    }

    const questionsCount = Number(
        document.getElementById("examPaidQuestionsCount").value,
    );

    const duration = Number(
        document.getElementById("examPaidDuration").value,
    );

    const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

    if (!isPositiveInt(questionsCount) || !isPositiveInt(duration)) {
        showToast("عدد الأسئلة والمدة يجب أن يكونا أرقامًا صحيحة موجبة", true);
        return;
    }

    const submitBtn = document.getElementById("examPaidSettingsSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const response = await apiRequest(EXAM_PAID_SETTINGS_API, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Id: id,
                LessonId: lessonId,
                QuestionCount: questionsCount,
                Duration: formatMinutesToTimeSpan(duration),
            }),
        });

        if (!response.ok) {
            console.error(await response.text());
            showToast("تعذر حفظ إعدادات الامتحان المدفوع", true);
            return;
        }

        showToast("تم حفظ إعدادات الامتحان المدفوع بنجاح");
        closeModal("examPaidSettingsModalOverlay");

    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء حفظ الإعدادات", true);

    } finally {
        setBtnLoading(submitBtn, false);
    }
}

/* =========================================================
MODAL HELPERS
(same custom overlay/show pattern already used by the
student page's purchase modal — no new modal system)
========================================================= */

function openModal(id) {
    const overlay = document.getElementById(id);

    if (!overlay) return;

    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal(id) {
    const overlay = document.getElementById(id);

    if (!overlay) return;

    overlay.classList.remove("show");
    document.body.style.overflow = "";
}

// Close on backdrop click, for every modal on this page
document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("ld-modal-overlay")) {
        e.target.classList.remove("show");
        document.body.style.overflow = "";
    }
});

function setBtnLoading(btn, isLoading) {
    if (!btn) return;

    btn.disabled = isLoading;
    btn.classList.toggle("ld-btn-loading", isLoading);
}

/* =========================================================
EMPTY STATE
========================================================= */

function emptyStateHTML(icon, title, text, onClickAttr, btnLabel) {
    return `
        <div class="ld-empty">
            <i class="bi ${icon}"></i>
            <h3>${title}</h3>
            <p>${text}</p>
            <button class="ld-add-btn" type="button" onclick="${onClickAttr}">
                ${btnLabel}
            </button>
        </div>
    `;
}

/* =========================================================
TOAST
========================================================= */

let toastTimer = null;

function showToast(message, isError) {
    const toast = document.getElementById("ldToast");

    if (!toast) return;

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.toggle("is-error", !!isError);

    toast.classList.add("show");

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2200);
}

/* =========================================================
HELPERS
========================================================= */

function setText(id, value) {
    const el = document.getElementById(id);

    if (el) {
        el.textContent = value ?? "";
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}

// Converts a TimeSpan-style "HH:MM:SS" string (as returned by
// /Lessons/get-random-values) into a whole number of minutes.
// Returns null if the value is missing/unparseable.
function parseDurationToMinutes(value) {
    if (value === null || value === undefined) return null;

    if (typeof value === "number") return value;

    const match = String(value).match(/^(\d+):(\d{2}):(\d{2})$/);

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);

    return hours * 60 + minutes + Math.round(seconds / 60);
}

// Converts a whole number of minutes into the "HH:MM:SS" TimeSpan format
// the server expects (used by add/edit exam and the paid-settings save).
function formatMinutesToDuration(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const pad = (n) => String(n).padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:00`;
}