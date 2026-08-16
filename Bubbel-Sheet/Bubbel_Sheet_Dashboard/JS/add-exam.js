"use strict";

/* =========================================================
    BUBBLE SHEET — TEACHER EXAM QUESTIONS
    =========================================================

    IMPORTANT:

    1. Exam details:
        /Lessons/Get-Lesson-Details?lessonId=...

    2. CURRENT EXAM QUESTIONS:
        /Exam/open-exam?ExamId=...

        This is intentionally the SAME endpoint used by
        the student exam.js.

    3. Question Bank:
        /QuestionBank/open-QuestionBank?QBankId=...

    4. SAVE:
        Not invented because no confirmed save endpoint was
        provided in the existing files.

    ========================================================= */

/* =========================================================
    CONFIG
    ========================================================= */

const CONFIG = {
    LESSON_DETAILS_API: "/Lessons/Get-Lesson-Details",

    EXAM_OPEN_API: "/Exam/open-exam",

    QUESTION_BANK_API: "/QuestionBank/open-QuestionBank",

    /*
     * IMPORTANT:
     * Keep null until the real backend endpoint is known.
     *
     * Example only:
     *
     * {
     *     url: "/Exam/Update-Questions",
     *     method: "POST"
     * }
     */
    SAVE_EXAM_QUESTIONS_API: {
    url: "/Exam/Update-Exam-Questions",
    method: "POST"
},
};

/* =========================================================
    STATE
    ========================================================= */

const state = {
    lessonId: 0,

    examId: 0,

    lesson: null,

    exam: null,

    banks: [],

    bankId: null,

    bankQuestions: [],

    examQuestions: [],

    selected: new Set(),

    sessionAdded: new Set(),

    originalExamIds: new Set(),

    loading: false,

    saving: false,
};

/* =========================================================
    DOM
    ========================================================= */

const $ = (id) => document.getElementById(id);

const el = {};

/* =========================================================
    INIT
    ========================================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    cacheElements();

    bindEvents();

    const params = new URLSearchParams(window.location.search);

    state.lessonId = Number(
        params.get("lessonId") || params.get("LessonId") || 0,
    );

    state.examId = Number(params.get("examId") || params.get("ExamId") || 0);

    if (!state.lessonId || !state.examId) {
        showFatalError("الرابط لازم يحتوي على lessonId و examId.");

        return;
    }

    try {
        /*
         * Use the existing auth flow if available.
         */
        if (typeof refreshToken === "function") {
            const refreshed = await refreshToken();

            if (!refreshed) {
                window.location.href = "login.html";

                return;
            }
        }

        await loadLesson();

        /*
         * IMPORTANT:
         *
         * Load the REAL current exam questions
         * using the SAME endpoint used by exam.js.
         */
        await loadCurrentExamQuestions();
    } catch (error) {
        console.error("[ADD EXAM] Initialization error:", error);

        showFatalError(
            getErrorMessage(error, "حدث خطأ أثناء تحميل بيانات الامتحان."),
        );
    }
}

/* =========================================================
    CACHE ELEMENTS
    ========================================================= */

function cacheElements() {
    [
        "examName",
        "examDesc",
        "duration",
        "lessonName",
        "examCount",
        "banksCount",
        "selectedMeta",
        "bottomCount",

        "bankSelect",
        "bankNote",
        "bankNoteText",
        "bankSubtitle",

        "bankSearch",
        "examSearch",

        "bankList",
        "examList",

        "selectAll",
        "clear",
        "removeAll",

        "refresh",
        "save",
        "saveTop",

        "toastbox",

        "modal",
        "closeModal",
        "cancelModal",
        "confirmRemove",
    ].forEach((id) => {
        el[id] = $(id);
    });
}

/* =========================================================
    EVENTS
    ========================================================= */

function bindEvents() {
    if (el.bankSelect) {
        el.bankSelect.addEventListener("change", bankChange);
    }

    if (el.bankSearch) {
        el.bankSearch.addEventListener("input", renderBank);
    }

    if (el.examSearch) {
        el.examSearch.addEventListener("input", renderExam);
    }

    if (el.selectAll) {
        el.selectAll.addEventListener("click", selectAll);
    }

    if (el.clear) {
        el.clear.addEventListener("click", clearSelection);
    }

    if (el.removeAll) {
        el.removeAll.addEventListener("click", () => {
            if (state.examQuestions.length) {
                openRemoveAllModal();
            }
        });
    }

    if (el.closeModal) {
        el.closeModal.addEventListener("click", closeModal);
    }

    if (el.cancelModal) {
        el.cancelModal.addEventListener("click", closeModal);
    }

    if (el.confirmRemove) {
        el.confirmRemove.addEventListener("click", () => {
            state.examQuestions = [];

            state.selected.clear();

            state.sessionAdded.clear();

            state.originalExamIds.clear();

            closeModal();

            renderAll();

            toast("تمت إزالة كل الأسئلة محليًا.", "success");
        });
    }

    if (el.modal) {
        el.modal.addEventListener("click", (event) => {
            if (event.target === el.modal) {
                closeModal();
            }
        });
    }

    if (el.refresh) {
        el.refresh.addEventListener("click", async () => {
            await refreshPage();
        });
    }

    if (el.save) {
        el.save.addEventListener("click", save);
    }

    if (el.saveTop) {
        el.saveTop.addEventListener("click", save);
    }
}

/* =========================================================
    CLEAR SELECTION
    =========================================================

    "إلغاء التحديد" removes only the questions that were
    added to the exam during THIS selection session (via
    checkbox / clicking the question / تحديد الكل), without
    touching questions that were already part of the exam
    before that.
    ========================================================= */

function clearSelection() {
    state.selected.clear();

    if (state.sessionAdded.size) {
        state.examQuestions = state.examQuestions.filter(
            (question) => !state.sessionAdded.has(String(question.questionId)),
        );

        state.sessionAdded.clear();
    }

    renderAll();

    toast("تم إلغاء التحديد الحالي.", "info");
}

/* =========================================================
    API REQUEST
    ========================================================= */

async function request(url, options = {}) {
    /*
     * Use the existing apiRequest()
     * because it already handles the
     * project's authentication flow.
     */

    if (typeof apiRequest === "function") {
        return apiRequest(url, options);
    }

    /*
     * Fallback only.
     */

    return fetch(url, {
        ...options,
        credentials: "include",
    });
}

/* =========================================================
    ERROR TEXT
    ========================================================= */

async function getResponseError(response, fallback) {
    try {
        const text = await response.text();

        if (!text) {
            return fallback;
        }

        try {
            const json = JSON.parse(text);

            return (
                json.message ||
                json.Message ||
                json.title ||
                json.Title ||
                json.error ||
                json.Error ||
                fallback
            );
        } catch (_) {
            return text;
        }
    } catch (_) {
        return fallback;
    }
}

function getErrorMessage(error, fallback) {
    if (error && error.message) {
        return error.message;
    }

    return fallback;
}

/* =========================================================
    LOAD LESSON
    ========================================================= */

async function loadLesson(showRefreshToast = false) {
    showLoading("جاري تحميل بيانات الدرس...");

    const response = await request(
        `${CONFIG.LESSON_DETAILS_API}?lessonId=${encodeURIComponent(state.lessonId)}`,
        {
            method: "GET",
        },
    );

    if (!response.ok) {
        throw new Error(
            await getResponseError(response, "تعذر تحميل بيانات الدرس."),
        );
    }

    state.lesson = await response.json();

    console.log("[ADD EXAM] Lesson:", state.lesson);

    state.banks = Array.isArray(state.lesson?.questionBanks)
        ? [...state.lesson.questionBanks]
        : [];

    /*
     * Find exam metadata from lesson details.
     */
    const exams = Array.isArray(state.lesson?.exams) ? state.lesson.exams : [];

    state.exam = exams.find(
        (exam) => String(exam.examId) === String(state.examId),
    ) || {
        examId: state.examId,

        examName: "الامتحان",

        description: "",
    };

    renderExamMeta();

    renderBanks();

    if (showRefreshToast) {
        toast("تم تحديث بيانات الدرس.", "success");
    }
}

/* =========================================================
    LOAD CURRENT EXAM QUESTIONS
    =========================================================

    SAME API USED BY exam.js:

    /Exam/open-exam?ExamId=...

    exam.js:
    examData.questions
    OR
    examData.Questions
    ========================================================= */

async function loadCurrentExamQuestions() {
    setExamListLoading("جاري تحميل أسئلة الامتحان الحالية...");

    try {
        const response = await request(
            `${CONFIG.EXAM_OPEN_API}?ExamId=${encodeURIComponent(state.examId)}`,
            {
                method: "GET",
            },
        );

        if (!response.ok) {
            /*
             * If backend returns 409 because
             * the exam is already submitted,
             * we still need to know whether the
             * response contains questions.
             */
            const message = await getResponseError(
                response,
                "تعذر تحميل أسئلة الامتحان.",
            );

            throw new Error(message);
        }

        const data = await response.json();

        console.log("[ADD EXAM] OPEN EXAM RESPONSE:", data);

        /*
         * SAME logic as exam.js.
         */

        const rawQuestions = Array.isArray(data?.questions)
            ? data.questions
            : Array.isArray(data?.Questions)
                ? data.Questions
                : [];

        state.examQuestions = rawQuestions
            .map(normalizeQuestion)
            .filter((question) => question.questionId !== null);

        console.log("[ADD EXAM] CURRENT EXAM QUESTIONS:", state.examQuestions);

        /*
         * These questions came from the server, meaning
         * they are already saved. Track them separately
         * so their checkboxes stay disabled (can't be
         * unchecked here) while newly-added, not-yet-saved
         * questions remain toggleable.
         */

        state.originalExamIds = new Set(
            state.examQuestions.map((question) => String(question.questionId)),
        );

        /*
         * Update duration from open-exam
         * if lesson details didn't contain it.
         */

        if (data?.duration !== undefined) {
            state.exam = state.exam || {};

            state.exam.duration = data.duration;
        }

        if (data?.Duration !== undefined) {
            state.exam = state.exam || {};

            state.exam.duration = data.Duration;
        }

        renderExamMeta();

        renderAll();
    } catch (error) {
        console.error("[ADD EXAM] Failed to load current exam questions:", error);

        state.examQuestions = [];

        state.originalExamIds = new Set();

        renderExam();

        toast(
            getErrorMessage(error, "تعذر تحميل أسئلة الامتحان الحالية."),
            "error",
        );
    }
}

/* =========================================================
    REFRESH
    ========================================================= */

async function refreshPage() {
    if (state.loading) {
        return;
    }

    try {
        state.selected.clear();

        state.sessionAdded.clear();

        state.originalExamIds.clear();

        state.bankQuestions = [];

        state.bankId = null;

        if (el.bankSelect) {
            el.bankSelect.value = "";
        }

        await loadLesson(false);

        /*
         * VERY IMPORTANT:
         * Re-fetch current exam questions
         * from the same API used by student exam.js.
         */

        await loadCurrentExamQuestions();

        toast("تم تحديث الامتحان والأسئلة.", "success");
    } catch (error) {
        console.error(error);

        toast(getErrorMessage(error, "حدث خطأ أثناء التحديث."), "error");
    }
}

/* =========================================================
    EXAM META
    ========================================================= */

function renderExamMeta() {
    const exam = state.exam || {};

    if (el.examName) {
        el.examName.textContent = exam.examName || exam.name || "الامتحان";
    }

    if (el.examDesc) {
        el.examDesc.textContent =
            exam.description || "إدارة أسئلة الامتحان من بنوك الأسئلة";
    }

    if (el.lessonName) {
        el.lessonName.textContent = state.lesson?.lessonName || "الدرس";
    }

    const duration =
        exam.duration ?? exam.Duration ?? exam.examDuration ?? exam.durationMinutes;

    if (el.duration) {
        el.duration.textContent = formatDuration(duration);
    }

    if (el.banksCount) {
        el.banksCount.textContent = `${state.banks.length} بنك`;
    }
}

function formatDuration(value) {
    if (value === null || value === undefined || value === "") {
        return "بدون حد زمني";
    }

    /*
     * If backend returns a normal number,
     * treat it as minutes.
     */

    if (typeof value === "number") {
        return `${value} دقيقة`;
    }

    const str = String(value).trim();

    /*
     * TimeSpan:
     * 00:10:00
     */

    if (str.includes(":")) {
        const parts = str.split(":").map((part) => Number(part) || 0);

        if (parts.length === 3) {
            const hours = parts[0];

            const minutes = parts[1];

            if (hours > 0) {
                return `${hours} ساعة و ${minutes} دقيقة`;
            }

            return `${minutes} دقيقة`;
        }

        if (parts.length === 2) {
            return `${parts[0]} دقيقة`;
        }
    }

    return `${str} دقيقة`;
}

/* =========================================================
    BANKS
    ========================================================= */

function renderBanks() {
    if (!el.bankSelect) {
        return;
    }

    el.bankSelect.innerHTML = `
<option value="">
    اختر بنك الأسئلة...
</option>
`;

    state.banks.forEach((bank) => {
        const option = document.createElement("option");

        option.value = String(bank.bankId);

        option.textContent = `${bank.bankName || "بنك الأسئلة"}${bank.isActive === false ? " — غير نشط" : " — نشط"
            }`;

        el.bankSelect.appendChild(option);
    });
}

/* =========================================================
    BANK CHANGE
    ========================================================= */

async function bankChange() {
    state.bankId = Number(el.bankSelect?.value) || null;

    state.bankQuestions = [];

    state.selected.clear();

    if (!state.bankId) {
        if (el.bankNote) {
            el.bankNote.classList.add("hidden");
        }

        if (el.bankSubtitle) {
            el.bankSubtitle.textContent = "اختر بنك الأسئلة أولاً";
        }

        renderBank();

        counters();

        toolbar();

        return;
    }

    const bank = state.banks.find(
        (item) => String(item.bankId) === String(state.bankId),
    );

    if (el.bankNote) {
        el.bankNote.classList.remove("hidden");
    }

    if (el.bankNoteText) {
        el.bankNoteText.textContent =
            bank?.isActive === false
                ? "البنك غير نشط للطلاب لكنه متاح هنا للمدرس."
                : "البنك نشط حاليًا.";
    }

    await loadBank();
}

/* =========================================================
    LOAD BANK QUESTIONS
    ========================================================= */

async function loadBank() {
    if (state.loading) {
        return;
    }

    state.loading = true;

    setBankListLoading("جاري تحميل أسئلة البنك...");

    try {
        const response = await request(
            `${CONFIG.QUESTION_BANK_API}?QBankId=${encodeURIComponent(state.bankId)}`,
            {
                method: "GET",
            },
        );

        if (!response.ok) {
            throw new Error(
                await getResponseError(response, "تعذر تحميل أسئلة البنك."),
            );
        }

        const data = await response.json();

        console.log("[ADD EXAM] BANK RESPONSE:", data);

        state.bankQuestions = Array.isArray(data?.questions)
            ? data.questions
                .map(normalizeQuestion)
                .filter((question) => question.questionId !== null)
            : [];

        const bank = state.banks.find(
            (item) => String(item.bankId) === String(state.bankId),
        );

        if (el.bankSubtitle) {
            el.bankSubtitle.textContent = `${bank?.bankName || "بنك الأسئلة"} • ${state.bankQuestions.length} سؤال`;
        }

        renderBank();

        counters();

        toolbar();
    } catch (error) {
        console.error("[ADD EXAM] Bank load error:", error);

        state.bankQuestions = [];

        if (el.bankList) {
            el.bankList.innerHTML = `
        <div class="empty">
            <div class="emptyicon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>
                تعذر تحميل الأسئلة
            </h3>

            <p>
                ${escapeHtml(
                getErrorMessage(error, "حدث خطأ أثناء تحميل بنك الأسئلة."),
            )}
            </p>
        </div>
    `;
        }

        toast(getErrorMessage(error, "تعذر تحميل أسئلة البنك."), "error");
    } finally {
        state.loading = false;

        toolbar();
    }
}

/* =========================================================
    RENDER BANK
    ========================================================= */

function renderBank() {
    if (!el.bankList) {
        return;
    }

    if (!state.bankId) {
        el.bankList.innerHTML = `
    <div class="empty">

        <div class="emptyicon">
            <i class="fa-solid fa-database"></i>
        </div>

        <h3>
            اختر بنك الأسئلة
        </h3>

        <p>
            بعد اختيار البنك هتظهر الأسئلة هنا.
        </p>

    </div>
`;

        toolbar();

        return;
    }

    const filtered = filterQuestions(state.bankQuestions, el.bankSearch?.value);

    if (!filtered.length) {
        el.bankList.innerHTML = `
    <div class="empty">

        <div class="emptyicon">
            <i class="fa-solid fa-magnifying-glass"></i>
        </div>

        <h3>
            لا توجد نتائج
        </h3>

        <p>
            جرب كلمة بحث مختلفة.
        </p>

    </div>
`;

        toolbar();

        return;
    }

    el.bankList.innerHTML = filtered
        .map((question, index) => buildBankCard(question, index))
        .join("");

    toolbar();
}

/* =========================================================
    BANK CARD
    =========================================================

    The whole card is clickable now (not only the checkbox):
    clicking anywhere on a question that isn't already inside
    the exam selects it, and the checkbox shows a check mark.
    ========================================================= */

function buildBankCard(question, index) {
    const id = question.questionId;

    const inside = isQuestionInsideExam(id);

    /*
     * "locked" = this question was already saved on the
     * server before this session started. Its checkbox
     * stays checked but disabled, since removing it here
     * needs the explicit "إزالة من الامتحان" action, not a
     * plain uncheck.
     *
     * Anything added DURING this session (not locked) can
     * be freely checked/unchecked with the checkbox, or by
     * clicking the question itself.
     */

    const locked = state.originalExamIds.has(String(id));

    const checked = inside;

    const clickable = !locked && !inside;

    const cardClickAttr = clickable
        ? `onclick="window.selectQuestionCard(${Number(id)}, event)"`
        : "";

    return `
<article
    class="card ${checked ? "selected" : ""} ${clickable ? "clickable" : ""}"
    ${cardClickAttr}
>

    <div class="qhead">

        <input
            class="check"
            type="checkbox"
            ${checked ? "checked" : ""}
            ${locked ? "disabled" : ""}
            onclick="event.stopPropagation()"
            onchange="
                window.toggleQ(
                    ${Number(id)},
                    this.checked
                )
            "
        >

        <div class="num">
            ${index + 1}
        </div>

        <div class="qmain">

            ${buildBadges(question, inside)}

            <h3 class="qtitle">
                ${escapeHtml(question.questionTitle)}
            </h3>

            ${buildImage(question)}

            ${buildChoices(question)}

            <div class="cardactions">

                ${inside
            ? `
                            <button
                                class="remove"
                                onclick="
                                    event.stopPropagation();
                                    window.removeQ(
                                        ${Number(id)}
                                    )
                                "
                            >
                                <i class="fa-solid fa-minus"></i>
                                إزالة من الامتحان
                            </button>
                            `
            : `
                            <button
                                class="add"
                                onclick="
                                    event.stopPropagation();
                                    window.toggleQ(
                                        ${Number(id)},
                                        true
                                    )
                                "
                            >
                                <i class="fa-solid fa-plus"></i>
                                تحديد السؤال
                            </button>
                            `
        }

            </div>

        </div>

    </div>

</article>
`;
}

/* =========================================================
    RENDER EXAM QUESTIONS
    ========================================================= */

function renderExam() {
    if (!el.examList) {
        return;
    }

    const filtered = filterQuestions(state.examQuestions, el.examSearch?.value);

    if (!filtered.length) {
        el.examList.innerHTML = `
    <div class="empty">

        <div class="emptyicon">
            <i class="fa-solid fa-clipboard-question"></i>
        </div>

        <h3>
            ${state.examQuestions.length
                ? "لا توجد نتائج"
                : "لا توجد أسئلة في الامتحان"
            }
        </h3>

        <p>
            ${state.examQuestions.length
                ? "جرب كلمة بحث مختلفة."
                : "حدد أسئلة من البنك لإضافتها هنا."
            }
        </p>

    </div>
`;

        return;
    }

    el.examList.innerHTML = filtered
        .map((question, index) => buildExamCard(question, index))
        .join("");
}

/* =========================================================
    EXAM CARD
    ========================================================= */

function buildExamCard(question, index) {
    return `
<article class="card exam">

    <div class="qhead">

        <div class="num">
            ${index + 1}
        </div>

        <div class="qmain">

            ${buildBadges(question, true)}

            <h3 class="qtitle">
                ${escapeHtml(question.questionTitle)}
            </h3>

            ${buildImage(question)}

            ${buildChoices(question)}

            <div class="cardactions">

                <button
                    class="remove"
                    onclick="
                        window.removeQ(
                            ${Number(question.questionId)}
                        )
                    "
                >
                    <i class="fa-solid fa-trash-can"></i>
                    إزالة من الامتحان
                </button>

            </div>

        </div>

    </div>

</article>
`;
}

/* =========================================================
    QUESTION BADGES
    ========================================================= */

function buildBadges(question, inside) {
    const isTF = isTrueFalse(question);

    return `
<div class="badges">

    <span class="badge type">

        <i class="fa-solid ${isTF ? "fa-toggle-on" : "fa-list"}"></i>

        ${isTF ? "صح / خطأ" : "اختيار من متعدد"}

    </span>

    ${inside
            ? `
                <span class="badge inside">

                    <i class="fa-solid fa-circle-check"></i>

                    مضاف للامتحان

                </span>
                `
            : ""
        }

    <span class="qid">
        #${escapeHtml(question.questionId)}
    </span>

</div>
`;
}

/* =========================================================
    QUESTION IMAGE
    ========================================================= */

function buildImage(question) {
    const imageUrl = question.imgLink;

    if (!imageUrl) {
        return "";
    }

    return `
<img
    class="qimg"
    src="${escapeHtml(imageUrl)}"
    alt="صورة السؤال"
    loading="lazy"
    onerror="this.remove()"
>
`;
}

/* =========================================================
    QUESTION CHOICES
    =========================================================

    True / False questions are now rendered as TWO explicit
    fields ("صح" و "خطأ") instead of a single summary line,
    even when the backend only sends one choice entry (i.e.
    answer #2 is missing from the API response). The correct
    side is detected from whichever choice is marked correct;
    if nothing can be detected, neither side is marked.
    ========================================================= */

function buildChoices(question) {
    const choices = Array.isArray(question.choices) ? question.choices : [];

    /*
     * True / False
     */

    if (isTrueFalse(question)) {
        return buildTrueFalseChoices(choices);
    }

    /*
     * MCQ
     */

    if (!choices.length) {
        return "";
    }

    const letters = ["أ", "ب", "ج", "د", "هـ", "و"];

    return `
<div class="choices">

    ${choices
            .map((choice, index) => {
                const correct = Boolean(choice.isCorrect);

                return `
                    <div
                        class="choice ${correct ? "correct" : ""}"
                    >

                        <span class="letter">
                            ${letters[index] || index + 1}
                        </span>

                        <span class="ctext">
                            ${escapeHtml(choice.choiceText)}
                        </span>

                        ${correct
                        ? `
                                    <span class="correctlabel">
                                        الإجابة الصحيحة
                                    </span>
                                    `
                        : ""
                    }

                    </div>
                `;
            })
            .join("")}

</div>
`;
}

/* =========================================================
    TRUE / FALSE CHOICES (always 2 explicit fields)
    ========================================================= */

function buildTrueFalseChoices(choices) {
    /*
     * Normally the correct choice is the one flagged
     * isCorrect. But when the backend only sends ONE
     * choice for a True/False question (answer #2 is
     * missing), that single choice IS the correct answer
     * even if isCorrect wasn't set on it.
     */

    let correctChoice = choices.find((choice) => choice.isCorrect);

    if (!correctChoice && choices.length === 1) {
        correctChoice = choices[0];
    }

    const correctText = String(correctChoice?.choiceText ?? "")
        .toLowerCase()
        .trim();

    let trueIsCorrect =
        correctText === "true" ||
        correctText === "1" ||
        correctText === "yes" ||
        correctText === "t" ||
        correctText.includes("صحيح") ||
        correctText.includes("صح") ||
        correctText.includes("true");

    let falseIsCorrect =
        correctText === "false" ||
        correctText === "0" ||
        correctText === "no" ||
        correctText === "f" ||
        correctText.includes("خطأ") ||
        correctText.includes("خطا") ||
        correctText.includes("غلط") ||
        correctText.includes("false");

    /*
     * If we found a correct choice but couldn't match its
     * text to either side (unexpected wording from the
     * backend), fall back to marking the side whose text
     * matches the correct choice's text exactly.
     */

    if (correctChoice && !trueIsCorrect && !falseIsCorrect) {
        trueIsCorrect = correctText === "صح";

        falseIsCorrect = correctText === "خطأ";
    }

    return `
<div class="choices">

    <div class="choice ${trueIsCorrect ? "correct" : ""}">

        <span class="letter">
            ١
        </span>

        <span class="ctext">
            صح
        </span>

        ${trueIsCorrect
            ? `
                <span class="correctlabel">
                    الإجابة الصحيحة
                </span>
                `
            : ""
        }

    </div>

    <div class="choice ${falseIsCorrect ? "correct" : ""}">

        <span class="letter">
            ٢
        </span>

        <span class="ctext">
            خطأ
        </span>

        ${falseIsCorrect
            ? `
                <span class="correctlabel">
                    الإجابة الصحيحة
                </span>
                `
            : ""
        }

    </div>

</div>
`;
}

/* =========================================================
    QUESTION TYPE
    ========================================================= */

function isTrueFalse(question) {
    const type = question.questionType;

    if (typeof type === "number") {
        return type === 1;
    }

    const value = String(type ?? "")
        .toLowerCase()
        .trim();

    return (
        value === "1" ||
        value.includes("true") ||
        value.includes("false") ||
        value.includes("boolean") ||
        value.includes("truefalse")
    );
}

/* =========================================================
    NORMALIZE QUESTION
    =========================================================

    This follows the SAME fields used by exam.js:

    questionId
    questionTitle
    questionType
    imgLink
    choices
    choiseId
    text
    isCorrect
    ========================================================= */

function normalizeQuestion(question) {
    if (!question) {
        return {
            questionId: null,

            questionTitle: "",

            questionType: 0,

            imgLink: null,

            choices: [],
        };
    }

    return {
        ...question,

        questionId: toNumber(
            question.questionId ?? question.QuestionId ?? question.id ?? question.Id,
        ),

        questionTitle:
            question.questionTitle ??
            question.QuestionTitle ??
            question.title ??
            question.Title ??
            question.questionText ??
            question.QuestionText ??
            question.text ??
            question.Text ??
            "",

        questionType: normalizeType(
            question.questionType ??
            question.QuestionType ??
            question.type ??
            question.Type,
        ),

        imgLink:
            question.imgLink ??
            question.ImgLink ??
            question.ImageLink ??
            question.imageLink ??
            question.imageUrl ??
            question.ImageUrl ??
            question.imagePath ??
            question.ImagePath ??
            question.questionImage ??
            question.QuestionImage ??
            question.photoUrl ??
            question.PhotoUrl ??
            question.image ??
            question.Image ??
            null,

        choices: Array.isArray(question.choices)
            ? question.choices.map(normalizeChoice)
            : Array.isArray(question.Choices)
                ? question.Choices.map(normalizeChoice)
                : [],
    };
}

/* =========================================================
    NORMALIZE CHOICE
    ========================================================= */

function normalizeChoice(choice) {
    if (!choice) {
        return {
            choiseId: null,

            choiceText: "",

            isCorrect: false,
        };
    }

    return {
        ...choice,

        choiseId: toNumber(
            choice.choiseId ??
            choice.ChoiseId ??
            choice.choiceId ??
            choice.ChoiceId ??
            choice.id ??
            choice.Id,
        ),

        choiceText:
            choice.choiceText ??
            choice.ChoiceText ??
            choice.text ??
            choice.Text ??
            choice.choiceName ??
            choice.ChoiceName ??
            choice.name ??
            choice.Name ??
            "",

        isCorrect: Boolean(choice.isCorrect ?? choice.IsCorrect ?? false),
    };
}

/* =========================================================
    NORMALIZE TYPE
    ========================================================= */

function normalizeType(value) {
    if (typeof value === "number") {
        return value;
    }

    if (value === null || value === undefined) {
        return 0;
    }

    const stringValue = String(value).toLowerCase();

    if (
        stringValue.includes("true") ||
        stringValue.includes("false") ||
        stringValue.includes("boolean") ||
        stringValue.includes("truefalse")
    ) {
        return 1;
    }

    return 0;
}

/* =========================================================
    NUMBER
    ========================================================= */

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

/* =========================================================
    CHECK QUESTION IN EXAM
    ========================================================= */

function isQuestionInsideExam(questionId) {
    return state.examQuestions.some(
        (question) => String(question.questionId) === String(questionId),
    );
}

/* =========================================================
    SELECT QUESTION BY CLICKING THE CARD
    =========================================================

    Clicking anywhere on a bank question (not just the
    checkbox) selects and adds it to the exam, unless the
    click came from the checkbox or a button (they handle
    their own logic and stop propagation).
    ========================================================= */

function selectQuestionCard(questionId, event) {
    if (
        event &&
        (event.target.closest(".check") || event.target.closest("button"))
    ) {
        return;
    }

    if (isQuestionInsideExam(questionId)) {
        return;
    }

    toggleQuestion(questionId, true);
}

/* =========================================================
    TOGGLE QUESTION
    ========================================================= */

function toggleQuestion(questionId, enabled) {
    const id = String(questionId);

    /*
     * Question already inside the exam:
     *
     * - If it was ADDED THIS SESSION (not locked) and the
     *   checkbox got unchecked, remove it from the exam.
     *
     * - If it's LOCKED (already saved before this session),
     *   the checkbox is disabled so this path only runs for
     *   the "checked" case, which is a no-op.
     */

    if (isQuestionInsideExam(questionId)) {
        state.selected.delete(id);

        if (!enabled && !state.originalExamIds.has(id)) {
            removeQuestion(questionId);

            return;
        }

        renderBank();

        counters();

        return;
    }

    if (enabled) {
        state.selected.add(id);
    } else {
        state.selected.delete(id);
    }

    /*
     * Add immediately.
     */

    if (enabled) {
        addSelectedQuestions();
    } else {
        renderBank();

        counters();

        toolbar();
    }
}

/* =========================================================
    ADD SELECTED QUESTIONS
    ========================================================= */

function addSelectedQuestions() {
    const added = [];

    state.selected.forEach((id) => {
        const question = state.bankQuestions.find(
            (item) => String(item.questionId) === String(id),
        );

        if (!question) {
            return;
        }

        if (isQuestionInsideExam(question.questionId)) {
            return;
        }

        added.push(question);
    });

    if (!added.length) {
        return;
    }

    state.examQuestions.push(...added);

    added.forEach((question) => {
        state.sessionAdded.add(String(question.questionId));
    });

    state.selected.clear();

    renderAll();

    toast(`تمت إضافة ${added.length} سؤال للامتحان.`, "success");
}

/* =========================================================
    SELECT ALL
    ========================================================= */

function selectAll() {
    const filtered = filterQuestions(state.bankQuestions, el.bankSearch?.value);

    filtered.forEach((question) => {
        if (!isQuestionInsideExam(question.questionId)) {
            state.selected.add(String(question.questionId));
        }
    });

    addSelectedQuestions();
}

/* =========================================================
    REMOVE QUESTION
    ========================================================= */

function removeQuestion(questionId) {
    state.examQuestions = state.examQuestions.filter(
        (question) => String(question.questionId) !== String(questionId),
    );

    state.selected.delete(String(questionId));

    state.sessionAdded.delete(String(questionId));

    renderAll();

    toast("تمت إزالة السؤال من الامتحان محليًا.", "success");
}

/* =========================================================
    REMOVE ALL MODAL
    ========================================================= */

function openRemoveAllModal() {
    if (!el.modal) {
        return;
    }

    el.modal.classList.remove("hidden");
}

function closeModal() {
    if (!el.modal) {
        return;
    }

    el.modal.classList.add("hidden");
}

/* =========================================================
    RENDER ALL
    ========================================================= */

function renderAll() {
    renderBank();

    renderExam();

    counters();

    toolbar();
}

/* =========================================================
    COUNTERS
    ========================================================= */

function counters() {
    const examCount = state.examQuestions.length;

    /*
     * "selected" is only a transient set used while a
     * checkbox click is being processed - the meaningful,
     * persistent count is how many questions were added
     * during this session and are not saved yet.
     */

    const selectedCount = state.sessionAdded.size;

    if (el.examCount) {
        el.examCount.textContent = examCount;
    }

    if (el.selectedMeta) {
        el.selectedMeta.textContent = `${selectedCount} سؤال محدد`;
    }

    if (el.bottomCount) {
        el.bottomCount.textContent = `${selectedCount} سؤال محدد`;
    }

    if (el.removeAll) {
        el.removeAll.disabled = examCount === 0;
    }
}

/* =========================================================
    TOOLBAR
    ========================================================= */

function toolbar() {
    const bankReady = Boolean(state.bankId) && !state.loading;

    if (el.selectAll) {
        el.selectAll.disabled = !bankReady || !state.bankQuestions.length;
    }

    if (el.clear) {
        el.clear.disabled = !state.selected.size && !state.sessionAdded.size;
    }
}

/* =========================================================
    SEARCH
    ========================================================= */

function filterQuestions(questions, searchValue) {
    const search = String(searchValue || "")
        .trim()
        .toLowerCase();

    if (!search) {
        return questions;
    }

    return questions.filter((question) => {
        const choices = Array.isArray(question.choices) ? question.choices : [];

        const searchable = [
            question.questionTitle,

            question.questionId,

            ...choices.map((choice) => choice.choiceText),
        ]
            .join(" ")
            .toLowerCase();

        return searchable.includes(search);
    });
}

/* =========================================================
    LOADING
    ========================================================= */

function setBankListLoading(message) {
    if (!el.bankList) {
        return;
    }

    el.bankList.innerHTML = `
<div class="loading">

    <div class="spinner"></div>

    ${escapeHtml(message)}

</div>
`;
}

function setExamListLoading(message) {
    if (!el.examList) {
        return;
    }

    el.examList.innerHTML = `
<div class="loading">

    <div class="spinner"></div>

    ${escapeHtml(message)}

</div>
`;
}

function showLoading(message) {
    setBankListLoading(message);

    setExamListLoading(message);
}

/* =========================================================
    SAVE
    ========================================================= */

async function save() {
    if (state.saving) {
        return;
    }

    const payload = buildSavePayload();

    console.log("[ADD EXAM] SAVE PAYLOAD:", payload);

    /*
     * No confirmed backend endpoint exists
     * in the supplied files.
     *
     * Do NOT invent one.
     */

    if (!CONFIG.SAVE_EXAM_QUESTIONS_API) {
        toast(
            "الأسئلة الحالية اتجابت من نفس API بتاع exam.js، لكن Endpoint حفظ ربط الأسئلة بالامتحان غير موجود في الملفات الحالية.",
            "error",
        );

        console.warn("[ADD EXAM] SAVE_EXAM_QUESTIONS_API is not configured.");

        console.warn("[ADD EXAM] Ready payload:", payload);

        return;
    }

    state.saving = true;

    const buttons = [el.save, el.saveTop].filter(Boolean);

    buttons.forEach((button) => {
        button.disabled = true;

        button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        جاري الحفظ...
    `;
    });

    try {
        const config = CONFIG.SAVE_EXAM_QUESTIONS_API;

        const response = await request(config.url, {
            method: config.method || "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(
                await getResponseError(response, "تعذر حفظ أسئلة الامتحان."),
            );
        }

        toast("تم حفظ أسئلة الامتحان بنجاح.", "success");
    } catch (error) {
        console.error("[ADD EXAM] Save error:", error);

        toast(getErrorMessage(error, "حدث خطأ أثناء حفظ أسئلة الامتحان."), "error");
    } finally {
        state.saving = false;

        buttons.forEach((button) => {
            button.disabled = false;

            button.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            حفظ أسئلة الامتحان
        `;
        });
    }
}

/* =========================================================
    SAVE PAYLOAD
    ========================================================= */

function buildSavePayload() {
    return {
        examId: Number(state.examId),

        lessonId: Number(state.lessonId),

        questionIds: state.examQuestions
            .map((question) => Number(question.questionId))
            .filter((id) => Number.isFinite(id)),
    };
}

/* =========================================================
    TOAST
    ========================================================= */

function toast(message, type = "info") {
    if (!el.toastbox) {
        console.log(`[${type}]`, message);

        return;
    }

    const toastElement = document.createElement("div");

    toastElement.className = `toast ${type}`;

    const icon =
        type === "error"
            ? "fa-circle-exclamation"
            : type === "success"
                ? "fa-circle-check"
                : "fa-circle-info";

    toastElement.innerHTML = `
<i class="fa-solid ${icon}"></i>

<span>
    ${escapeHtml(message)}
</span>
`;

    el.toastbox.appendChild(toastElement);

    window.setTimeout(() => {
        toastElement.remove();
    }, 3600);
}

/* =========================================================
    FATAL ERROR
    ========================================================= */

function showFatalError(message) {
    console.error("[ADD EXAM]", message);

    if (el.examList) {
        el.examList.innerHTML = `
    <div class="empty">

        <div class="emptyicon">
            <i class="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h3>
            تعذر تحميل الصفحة
        </h3>

        <p>
            ${escapeHtml(message)}
        </p>

    </div>
`;
    }

    toast(message, "error");
}

/* =========================================================
    ESCAPE HTML
    ========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
    GLOBAL FUNCTIONS
    =========================================================

    Needed because the cards use inline onclick
    handlers in the existing HTML structure.
    ========================================================= */

window.toggleQ = toggleQuestion;

window.removeQ = removeQuestion;

window.selectQuestionCard = selectQuestionCard;

/* =========================================================
    DEBUG
    ========================================================= */

window.BubbleSheetTeacherExam = {
    getExamId: () => state.examId,

    getLessonId: () => state.lessonId,

    getExam: () => state.exam,

    getExamQuestions: () => [...state.examQuestions],

    getBankQuestions: () => [...state.bankQuestions],

    getSelected: () => [...state.selected],

    getSavePayload: () => buildSavePayload(),
};
