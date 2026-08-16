/* =========================================================
BUBBLE SHEET — EXAM.JS
Exam Solving Page
Real API integration

IMPORTANT:
- This page is ONLY for solving an exam.
- Review mode is completely removed from this page.
- Submitted exams are redirected to review-exam.html.
========================================================= */

"use strict";

/* =========================================================
STATE
========================================================= */

let examId = null;
let subjectId = null;

let examDetails = null;
let examData = null;

let attemptId = null;

let questions = [];
let answers = {};

let currentQuestionIndex = 0;

let examStarted = false;
let examSubmitted = false;
let isOpeningExam = false;
let isSubmitting = false;

let timerInterval = null;
let remainingSeconds = 0;

let violationCount = 0;
const MAX_VIOLATIONS = 5;

let toastTimeout = null;

let visibilityViolationLock = false;


/* =========================================================
API ERROR
========================================================= */

class ExamApiError extends Error {

    constructor(code, userMessage, cause, status) {

        super(userMessage);

        this.name = "ExamApiError";
        this.code = code;
        this.userMessage = userMessage;
        this.cause = cause;
        this.status = status;
    }
}


function describeHttpError(status) {

    switch (status) {

        case 401:
            return "انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى.";

        case 403:
            return "غير مسموح لك بالوصول إلى هذا الامتحان.";

        case 404:
            return "لم يتم العثور على الامتحان المطلوب.";

        case 409:
            return "تم تسليم هذا الامتحان بالفعل. يمكنك مراجعة نتيجتك من صفحة مراجعة الامتحانات.";

        case 422:
            return "بيانات الطلب غير صالحة.";

        case 500:
        case 502:
        case 503:
        case 504:
            return "حدث خطأ في الخادم، يرجى المحاولة لاحقًا.";

        default:
            return "حدث خطأ أثناء الاتصال بالخادم.";
    }
}


async function fetchExamJson(endpoint, options = {}) {

    const method =
        options.method || "GET";

    console.log(
        `[EXAM API] ${method} ${endpoint}`
    );

    let response;

    try {

        response =
            await apiRequest(
                endpoint,
                options
            );

    } catch (networkError) {

        console.error(
            `[EXAM API] Network/CORS error on ${endpoint}:`,
            networkError
        );

        throw new ExamApiError(
            "NETWORK",
            "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.",
            networkError
        );
    }

    console.log(
        `[EXAM API] Response status: ${response.status} (${endpoint})`
    );

    if (!response.ok) {

        let bodyText = "";

        try {
            bodyText = await response.text();
        } catch (_) {
            // ignore
        }

        console.error(
            `[EXAM API] HTTP ${response.status} on ${endpoint}`,
            bodyText
                ? bodyText.slice(0, 500)
                : "(no body)"
        );

        throw new ExamApiError(
            String(response.status),
            describeHttpError(response.status),
            null,
            response.status
        );
    }

    let data;

    try {

        data =
            await response.json();

    } catch (parseError) {

        console.error(
            `[EXAM API] JSON parse error on ${endpoint}:`,
            parseError
        );

        throw new ExamApiError(
            "PARSE",
            "استجابة غير متوقعة من الخادم.",
            parseError
        );
    }

    return data;
}


function userMessageFor(error) {

    if (error instanceof ExamApiError) {
        return error.userMessage;
    }

    return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
}


/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "[EXAM] Page initializing..."
        );

        initExamPage();
    }
);


async function initExamPage() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        examId =
            Number(params.get("examId")) ||
            Number(params.get("ExamId")) ||
            null;

        subjectId =
            Number(params.get("subjectId")) ||
            Number(params.get("SubjectId")) ||
            null;

        console.log(
            "[EXAM] ExamId:",
            examId,
            "SubjectId:",
            subjectId
        );

        if (
            !examId ||
            Number.isNaN(examId)
        ) {

            showExamLoadError(
                "لم يتم العثور على رقم الامتحان."
            );

            return;
        }

        bindExamEvents();

        await loadExamDetails();

    } catch (error) {

        console.error(
            "[EXAM ERROR] Initialization failed:",
            error
        );

        showExamLoadError(
            userMessageFor(error)
        );
    }
}


/* =========================================================
GET EXAM DETAILS
========================================================= */

async function loadExamDetails() {

    examDetails =
        await fetchExamJson(
            `/Exam/get-exam?ExamId=${encodeURIComponent(examId)}`,
            {
                method: "GET"
            }
        );

    console.log(
        "[EXAM] Exam details:",
        examDetails
    );

    renderExamDetails(
        examDetails
    );
}


function renderExamDetails(exam) {

    if (!exam) return;

    setText(
        "startExamName",
        exam.examName || "الامتحان"
    );

    setText(
        "examTitle",
        exam.examName || "الامتحان"
    );

    setText(
        "metaCount",
        `${exam.qCount ?? 0} سؤال`
    );

    const durationSeconds =
        parseTimeSpanToSeconds(
            exam.duration
        );

    setText(
        "metaDuration",
        formatDuration(
            durationSeconds
        )
    );

    setText(
        "metaSubject",
        subjectId
            ? `المادة رقم ${subjectId}`
            : "—"
    );

    setText(
        "metaYear",
        "—"
    );

    const subtitle =
        document.querySelector(
            ".exam-intro-card .ay-subtitle"
        );

    if (
        subtitle &&
        exam.description
    ) {

        subtitle.textContent =
            exam.description;
    }

    setText(
        "examSubMeta",
        `${exam.qCount ?? 0} سؤال • ${formatDuration(durationSeconds)}`
    );

    updateProgress(
        0,
        exam.qCount || 0
    );
}


/* =========================================================
OPEN EXAM
========================================================= */

async function openExam() {

    if (!examId) {

        showExamToast(
            "رقم الامتحان غير موجود."
        );

        return;
    }

    if (
        examStarted ||
        isOpeningExam
    ) {
        return;
    }

    isOpeningExam = true;

    hideExamLoadError();

    try {

        setButtonLoading(
            "startExamBtn",
            true,
            "جاري فتح الامتحان..."
        );

        examData =
            await fetchExamJson(
                `/Exam/open-exam?ExamId=${encodeURIComponent(examId)}`,
                {
                    method: "GET"
                }
            );

        console.log(
            "[EXAM] Opened exam:",
            examData
        );

        /*
         * IMPORTANT:
         * If the backend returns an already-submitted
         * attempt, DO NOT show its answers here.
         *
         * We redirect to the separate review page.
         */

        if (
            examData.alreadySubmitted === true ||
            examData.AlreadySubmitted === true ||
            examData.isSubmitted === true ||
            examData.IsSubmitted === true ||
            examData.submitted === true ||
            examData.Submitted === true
        ) {

            redirectToReviewPage();

            return;
        }

        attemptId =
            examData.attemptId ??
            examData.AttemptId ??
            null;

        questions =
            Array.isArray(
                examData.questions
            )
                ? examData.questions
                : Array.isArray(
                    examData.Questions
                )
                    ? examData.Questions
                    : [];

        console.log(
            "[EXAM] Questions:",
            JSON.stringify(
                questions,
                null,
                2
            )
        );

        if (!questions.length) {

            throw new ExamApiError(
                "NO_QUESTIONS",
                "الامتحان لا يحتوي على أسئلة."
            );
        }

        /*
         * Normal solving mode.
         */

        examStarted = true;
        examSubmitted = false;

        currentQuestionIndex = 0;

        answers = {};

        violationCount = 0;
        visibilityViolationLock = false;

        document.body.classList.add(
            "exam-lockdown"
        );

        showElement(
            "startScreen",
            false
        );

        showElement(
            "examScreen",
            true
        );

        showElement(
            "qnav",
            true
        );

        renderQuestions();

        renderQuestionNavigator();

        const durationSeconds =
            parseTimeSpanToSeconds(
                examData.duration ||
                examData.Duration ||
                examDetails?.duration
            );

        console.log(
            "[EXAM TIMER] Starting timer with",
            durationSeconds,
            "seconds"
        );

        startTimer(
            durationSeconds
        );

        updateProgress(
            0,
            questions.length
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        console.log(
            "[EXAM] Exam started.",
            {
                examId,
                attemptId,
                questionCount:
                    questions.length
            }
        );

    } catch (error) {

        console.error(
            "[EXAM ERROR] Failed to open exam:",
            error
        );

        examStarted = false;

        stopTimer();

        document.body.classList.remove(
            "exam-lockdown"
        );

        /*
         * If server says 409, this means the exam
         * was already submitted.
         *
         * NEVER load answers here.
         */
        if (
            error instanceof ExamApiError &&
            error.status === 409
        ) {

            redirectToReviewPage();

            return;
        }

        showExamLoadError(
            userMessageFor(error)
        );

    } finally {

        isOpeningExam = false;

        setButtonLoading(
            "startExamBtn",
            false,
            "ابدأ الامتحان"
        );
    }
}


/* =========================================================
REDIRECT TO REVIEW PAGE
========================================================= */

function redirectToReviewPage() {

    if (!examId) {
        return;
    }

    const params =
        new URLSearchParams();

    params.set(
        "examId",
        String(examId)
    );

    if (subjectId) {

        params.set(
            "subjectId",
            String(subjectId)
        );
    }

    window.location.href =
        `review-exam.html?${params.toString()}`;
}


/* =========================================================
RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        document.getElementById(
            "questionsContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    questions.forEach(
        (question, index) => {

            container.appendChild(
                createQuestionElement(
                    question,
                    index
                )
            );
        }
    );

    restoreAnswers();

    updateCurrentQuestion();
}


function createQuestionElement(
    question,
    index
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "gc question-card";

    wrapper.dataset.questionIndex =
        index;

    const questionId =
        getQuestionId(
            question
        );

    wrapper.dataset.questionId =
        String(questionId);

    const isTF =
        isTrueFalseQuestion(
            question
        );

    const choices =
        getQuestionChoices(
            question
        );

    /* ---------- HEAD ---------- */

    const head =
        document.createElement("div");

    head.className =
        "question-head";

    const badge =
        document.createElement("div");

    badge.className =
        "question-badge";

    badge.textContent =
        index + 1;

    badge.setAttribute(
        "aria-label",
        `السؤال ${index + 1}`
    );

    const typeLabel =
        document.createElement("span");

    typeLabel.className =
        "question-type-label";

    typeLabel.textContent =
        normalizeQuestionType(
            getQuestionType(
                question
            )
        );

    head.appendChild(
        badge
    );

    head.appendChild(
        typeLabel
    );

    wrapper.appendChild(
        head
    );

    /* ---------- QUESTION TEXT ---------- */

    const text =
        document.createElement("div");

    text.className =
        "question-text";

    text.textContent =
        getQuestionTitle(
            question
        ) ||
        "بدون نص";

    wrapper.appendChild(
        text
    );

    /* ---------- IMAGE ---------- */

    const imageLink =
        question.imgLink ??
        question.ImgLink ??
        question.imageUrl ??
        question.ImageUrl ??
        null;

    if (imageLink) {

        const imageBox =
            document.createElement(
                "div"
            );

        imageBox.className =
            "question-image";

        const image =
            document.createElement(
                "img"
            );

        image.src =
            imageLink;

        image.alt =
            `صورة السؤال ${index + 1}`;

        image.loading =
            "lazy";

        image.onerror =
            () => {
                imageBox.remove();
            };

        imageBox.appendChild(
            image
        );

        wrapper.appendChild(
            imageBox
        );
    }

    /* ---------- OPTIONS ---------- */

    const optionsBox =
        document.createElement(
            "div"
        );

    optionsBox.className =
        "question-options" +
        (
            isTF &&
            choices.length === 2
                ? " tf-options"
                : ""
        );

    if (!choices.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "exam-empty-question";

        empty.textContent =
            "لا توجد اختيارات لهذا السؤال.";

        optionsBox.appendChild(
            empty
        );
    }

    choices.forEach(
        (choice, choiceIndex) => {

            const choiceId =
                getChoiceId(
                    choice
                );

            const choiceText =
                getChoiceText(
                    choice
                );

            const item =
                document.createElement(
                    "label"
                );

            item.className =
                "option-item";

            item.dataset.questionId =
                String(questionId);

            item.dataset.choiceId =
                String(choiceId);

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "radio";

            input.className =
                "option-input";

            input.name =
                `question-${questionId}`;

            input.value =
                String(choiceId);

            input.dataset.questionId =
                String(questionId);

            input.dataset.choiceId =
                String(choiceId);

            const marker =
                document.createElement(
                    "span"
                );

            if (isTF) {

                marker.className =
                    "option-marker";

                marker.innerHTML =
                    `<i class="bi bi-check-lg option-check-icon" aria-hidden="true"></i>`;

            } else {

                marker.className =
                    "option-marker option-marker--letter";

                marker.textContent =
                    getArabicChoiceLetter(
                        choiceIndex
                    );
            }

            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "option-text";

            label.textContent =
                choiceText;

            item.appendChild(
                input
            );

            item.appendChild(
                marker
            );

            item.appendChild(
                label
            );

            optionsBox.appendChild(
                item
            );

            input.addEventListener(
                "change",
                () => {

                    if (
                        examSubmitted
                    ) {
                        return;
                    }

                    selectAnswer(
                        questionId,
                        choiceId
                    );
                }
            );
        }
    );

    wrapper.appendChild(
        optionsBox
    );

    /* ---------- NAVIGATION ---------- */

    const nav =
        document.createElement(
            "div"
        );

    nav.className =
        "question-navigation";

    const prevBtn =
        document.createElement(
            "button"
        );

    prevBtn.type =
        "button";

    prevBtn.className =
        "exam-secondary-btn";

    prevBtn.innerHTML =
        `<i class="bi bi-arrow-right"></i> السابق`;

    prevBtn.disabled =
        index === 0;

    prevBtn.addEventListener(
        "click",
        () => {

            goToQuestion(
                index - 1
            );
        }
    );

    const nextBtn =
        document.createElement(
            "button"
        );

    nextBtn.type =
        "button";

    nextBtn.className =
        "exam-primary-btn";

    nextBtn.innerHTML =
        `التالي <i class="bi bi-arrow-left"></i>`;

    nextBtn.disabled =
        index === questions.length - 1;

    nextBtn.addEventListener(
        "click",
        () => {

            goToQuestion(
                index + 1
            );
        }
    );

    nav.appendChild(
        prevBtn
    );

    nav.appendChild(
        nextBtn
    );

    wrapper.appendChild(
        nav
    );

    return wrapper;
}


/* =========================================================
ANSWERS
========================================================= */

function selectAnswer(
    questionId,
    choiceId
) {

    if (
        !examStarted ||
        examSubmitted
    ) {
        return;
    }

    if (
        choiceId === null ||
        choiceId === undefined ||
        choiceId === ""
    ) {

        console.warn(
            "[EXAM] Invalid choiceId:",
            {
                questionId,
                choiceId
            }
        );

        return;
    }

    answers[
        String(questionId)
    ] =
        Number(choiceId);

    updateChoiceVisualState(
        questionId,
        choiceId
    );

    updateQuestionNavigator();

    updateProgressByAnswers();
}


function updateChoiceVisualState(
    questionId,
    choiceId
) {

    const card =
        document.querySelector(
            `.question-card[data-question-id="${CSS.escape(String(questionId))}"]`
        );

    if (!card) return;

    card
        .querySelectorAll(
            ".option-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "is-selected",
                    String(
                        item.dataset.choiceId
                    ) ===
                    String(choiceId)
                );
            }
        );
}


function restoreAnswers() {

    Object.entries(
        answers
    ).forEach(
        ([questionId, choiceId]) => {

            const inputs =
                document.querySelectorAll(
                    `input.option-input[data-question-id="${CSS.escape(String(questionId))}"]`
                );

            inputs.forEach(
                input => {

                    if (
                        String(
                            input.dataset.choiceId
                        ) ===
                        String(choiceId)
                    ) {

                        input.checked =
                            true;
                    }
                }
            );

            updateChoiceVisualState(
                questionId,
                choiceId
            );
        }
    );
}


/* =========================================================
NAVIGATOR
========================================================= */

function renderQuestionNavigator() {

    const grid =
        document.getElementById(
            "qnavGrid"
        );

    if (!grid) return;

    grid.innerHTML = "";

    questions.forEach(
        (question, index) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "qnav-item";

            button.textContent =
                index + 1;

            button.dataset.index =
                index;

            button.setAttribute(
                "role",
                "listitem"
            );

            button.addEventListener(
                "click",
                () => {

                    goToQuestion(
                        index
                    );

                    closeQuestionNavigator();
                }
            );

            grid.appendChild(
                button
            );
        }
    );

    updateQuestionNavigator();
}


function updateQuestionNavigator() {

    const grid =
        document.getElementById(
            "qnavGrid"
        );

    if (!grid) return;

    grid
        .querySelectorAll(
            ".qnav-item"
        )
        .forEach(
            (button, index) => {

                const question =
                    questions[index];

                const questionId =
                    getQuestionId(
                        question
                    );

                const answered =
                    questionId != null &&
                    answers[
                        String(questionId)
                    ] != null;

                button.classList.toggle(
                    "answered",
                    answered
                );

                button.classList.toggle(
                    "current",
                    index ===
                    currentQuestionIndex
                );
            }
        );
}


/* =========================================================
QUESTION NAVIGATION
========================================================= */

function goToQuestion(index) {

    if (
        index < 0 ||
        index >= questions.length
    ) {
        return;
    }

    currentQuestionIndex =
        index;

    updateCurrentQuestion();

    const card =
        document.querySelector(
            `[data-question-index="${index}"]`
        );

    if (card) {

        card.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    updateQuestionNavigator();
}


function updateCurrentQuestion() {

    document
        .querySelectorAll(
            ".question-card"
        )
        .forEach(
            (card, index) => {

                card.classList.toggle(
                    "current",
                    index ===
                    currentQuestionIndex
                );
            }
        );

    updateQuestionNavigator();

    updateProgressByAnswers();
}


/* =========================================================
PROGRESS
========================================================= */

function updateProgress(
    current,
    total
) {

    const percent =
        total > 0
            ? Math.round(
                (current / total) * 100
            )
            : 0;

    const fill =
        document.getElementById(
            "examProgressFill"
        );

    const text =
        document.getElementById(
            "examProgressText"
        );

    const percentText =
        document.getElementById(
            "examProgressPercent"
        );

    const progress =
        document.getElementById(
            "examProgress"
        );

    if (fill) {

        fill.style.width =
            `${percent}%`;
    }

    if (text) {

        text.textContent =
            `${current} من ${total} أسئلة`;
    }

    if (percentText) {

        percentText.textContent =
            `${percent}%`;
    }

    if (progress) {

        progress.setAttribute(
            "aria-valuenow",
            percent
        );
    }
}


function updateProgressByAnswers() {

    updateProgress(
        Object.keys(
            answers
        ).length,
        questions.length
    );
}


/* =========================================================
TIMER
========================================================= */

function startTimer(seconds) {

    stopTimer();

    remainingSeconds =
        Number(seconds) || 0;

    updateTimerDisplay();

    if (
        remainingSeconds <= 0
    ) {

        console.warn(
            "[EXAM TIMER] Invalid or zero duration."
        );

        return;
    }

    timerInterval =
        setInterval(
            () => {

                if (
                    examSubmitted
                ) {

                    stopTimer();

                    return;
                }

                remainingSeconds--;

                updateTimerDisplay();

                if (
                    remainingSeconds <= 0
                ) {

                    stopTimer();

                    showExamToast(
                        "انتهى وقت الامتحان وسيتم إرسال إجاباتك تلقائيًا."
                    );

                    setTimeout(
                        () => {

                            submitExam(
                                true
                            );
                        },
                        1000
                    );
                }

            },
            1000
        );
}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }
}


function updateTimerDisplay() {

    const timerText =
        document.getElementById(
            "timerText"
        );

    if (timerText) {

        timerText.textContent =
            formatTimer(
                remainingSeconds
            );
    }

    const timer =
        document.getElementById(
            "examTimer"
        );

    if (timer) {

        timer.classList.toggle(
            "low-time",
            remainingSeconds <= 300 &&
            remainingSeconds > 0
        );
    }
}


/* =========================================================
SUBMIT MODAL
========================================================= */

function openSubmitModal() {

    if (
        !examStarted ||
        examSubmitted
    ) {
        return;
    }

    const backdrop =
        document.getElementById(
            "confirmModalBackdrop"
        );

    if (backdrop) {

        backdrop.classList.remove(
            "d-none"
        );
    }
}


function closeSubmitModal() {

    const backdrop =
        document.getElementById(
            "confirmModalBackdrop"
        );

    if (backdrop) {

        backdrop.classList.add(
            "d-none"
        );
    }
}


/* =========================================================
SUBMIT EXAM
========================================================= */

async function submitExam(
    automatic = false
) {

    if (
        !examStarted ||
        examSubmitted ||
        isSubmitting
    ) {
        return;
    }

    if (!attemptId) {

        showExamToast(
            "لم يتم العثور على رقم محاولة الامتحان."
        );

        console.error(
            "[EXAM SUBMIT] Missing AttemptId."
        );

        return;
    }

    isSubmitting = true;

    closeSubmitModal();

    stopTimer();

    setButtonLoading(
        "submitExamBtn",
        true,
        "جاري إرسال الامتحان..."
    );

    try {

        const payload = {

            studentAttemptId:
                Number(attemptId),

            answers:
                buildSubmitAnswers()
        };

        console.log(
            "[EXAM SUBMIT] Automatic:",
            automatic
        );

        console.log(
            "[EXAM SUBMIT] Payload:",
            payload
        );

        await fetchExamJson(
            "/Exam/submit-exam",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

        /*
         * IMPORTANT:
         * We do NOT show the result here.
         * We do NOT render correct answers here.
         * We do NOT save answers locally.
         *
         * After successful submission we redirect
         * to the separate review page.
         */

        examSubmitted = true;

        document.body.classList.remove(
            "exam-lockdown"
        );

        console.log(
            "[EXAM] Exam submitted successfully."
        );

        redirectToReviewPage();

    } catch (error) {

        console.error(
            "[EXAM ERROR] Submit failed:",
            error
        );

        if (
            error instanceof ExamApiError &&
            error.status === 409
        ) {

            examSubmitted = true;

            document.body.classList.remove(
                "exam-lockdown"
            );

            redirectToReviewPage();

        } else {

            /*
             * Timer has stopped because submit started.
             * If submission failed, allow the student
             * to try again.
             */

            if (
                !examSubmitted &&
                !automatic &&
                remainingSeconds > 0
            ) {

                startTimer(
                    remainingSeconds
                );
            }

            showExamToast(
                userMessageFor(error)
            );
        }

    } finally {

        isSubmitting = false;

        setButtonLoading(
            "submitExamBtn",
            false,
            "إرسال الامتحان"
        );
    }
}


function buildSubmitAnswers() {

    return Object.entries(
        answers
    )
        .filter(
            ([questionId, choiceId]) =>
                questionId !== "" &&
                choiceId !== "" &&
                choiceId !== null &&
                choiceId !== undefined &&
                !Number.isNaN(
                    Number(choiceId)
                )
        )
        .map(
            ([questionId, choiceId]) => ({

                questionId:
                    Number(questionId),

                choiceId:
                    Number(choiceId)
            })
        );
}


/* =========================================================
QUESTION VALIDATION
========================================================= */

function allQuestionsAnswered() {

    if (!questions.length) {
        return false;
    }

    return questions.every(
        question => {

            const questionId =
                getQuestionId(
                    question
                );

            const answer =
                answers[
                    String(questionId)
                ];

            return (
                answer !== undefined &&
                answer !== null &&
                answer !== ""
            );
        }
    );
}


function highlightUnansweredQuestions() {

    let firstUnanswered =
        null;

    document
        .querySelectorAll(
            ".question-card"
        )
        .forEach(
            card => {

                const questionId =
                    card.dataset.questionId;

                const answer =
                    answers[
                        String(questionId)
                    ];

                const answered =
                    answer !== undefined &&
                    answer !== null &&
                    answer !== "";

                if (!answered) {

                    if (!firstUnanswered) {
                        firstUnanswered =
                            card;
                    }

                    card.classList.add(
                        "unanswered-shake"
                    );

                    setTimeout(
                        () => {

                            card.classList.remove(
                                "unanswered-shake"
                            );

                        },
                        600
                    );
                }
            }
        );

    if (firstUnanswered) {

        firstUnanswered.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
VIOLATION SYSTEM
========================================================= */

function registerViolation(
    message
) {

    if (
        !examStarted ||
        examSubmitted
    ) {
        return;
    }

    violationCount++;

    console.warn(
        "[EXAM] Violation:",
        violationCount,
        message
    );

    showExamToast(
        `${message} (${violationCount}/${MAX_VIOLATIONS})`
    );

    if (
        violationCount >=
        MAX_VIOLATIONS
    ) {

        showExamToast(
            "تم تجاوز الحد المسموح للمخالفات وسيتم إنهاء الامتحان."
        );

        setTimeout(
            () => {

                submitExam(
                    true
                );

            },
            1500
        );
    }
}


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden ||
            !examStarted ||
            examSubmitted
        ) {
            return;
        }

        if (
            visibilityViolationLock
        ) {
            return;
        }

        visibilityViolationLock =
            true;

        registerViolation(
            "تم رصد مغادرة صفحة الامتحان."
        );

        setTimeout(
            () => {

                visibilityViolationLock =
                    false;

            },
            1000
        );
    }
);


window.addEventListener(
    "blur",
    () => {

        if (
            !examStarted ||
            examSubmitted
        ) {
            return;
        }

        if (document.hidden) {
            return;
        }

        if (
            visibilityViolationLock
        ) {
            return;
        }

        visibilityViolationLock =
            true;

        registerViolation(
            "تم رصد مغادرة نافذة الامتحان."
        );

        setTimeout(
            () => {

                visibilityViolationLock =
                    false;

            },
            1000
        );
    }
);


/* =========================================================
BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    event => {

        if (
            examStarted &&
            !examSubmitted
        ) {

            event.preventDefault();

            event.returnValue = "";
        }
    }
);


/* =========================================================
KEYBOARD PROTECTION
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            !examStarted ||
            examSubmitted
        ) {
            return;
        }

        const key =
            event.key.toLowerCase();

        if (
            event.ctrlKey &&
            key === "c"
        ) {

            event.preventDefault();

            showExamToast(
                "نسخ محتوى الامتحان غير مسموح."
            );
        }

        if (
            event.ctrlKey &&
            key === "v"
        ) {

            event.preventDefault();

            showExamToast(
                "لصق المحتوى غير مسموح."
            );
        }

        if (
            event.ctrlKey &&
            key === "x"
        ) {

            event.preventDefault();

            showExamToast(
                "قص محتوى الامتحان غير مسموح."
            );
        }

        if (
            event.ctrlKey &&
            key === "s"
        ) {

            event.preventDefault();
        }

        if (
            event.ctrlKey &&
            key === "p"
        ) {

            event.preventDefault();

            showPrintOverlay();
        }

        if (
            event.key === "F12"
        ) {

            event.preventDefault();
        }

        if (
            event.ctrlKey &&
            event.shiftKey &&
            key === "i"
        ) {

            event.preventDefault();
        }

        if (
            event.ctrlKey &&
            event.shiftKey &&
            key === "j"
        ) {

            event.preventDefault();
        }

        if (
            event.ctrlKey &&
            key === "u"
        ) {

            event.preventDefault();
        }
    }
);


/* =========================================================
CONTEXT MENU
========================================================= */

document.addEventListener(
    "contextmenu",
    event => {

        if (
            examStarted &&
            !examSubmitted
        ) {

            event.preventDefault();
        }
    }
);


/* =========================================================
PRINT
========================================================= */

window.addEventListener(
    "beforeprint",
    () => {

        if (
            examStarted &&
            !examSubmitted
        ) {

            showPrintOverlay();
        }
    }
);


function showPrintOverlay() {

    const overlay =
        document.getElementById(
            "printScreenOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove(
        "d-none"
    );

    setTimeout(
        () => {

            overlay.classList.add(
                "d-none"
            );

        },
        2500
    );

    if (
        examStarted &&
        !examSubmitted
    ) {

        registerViolation(
            "تم رصد محاولة طباعة أو التقاط محتوى الامتحان."
        );
    }
}


/* =========================================================
TOAST
========================================================= */

function showExamToast(
    message
) {

    const toast =
        document.getElementById(
            "examToast"
        );

    const text =
        document.getElementById(
            "examToastMsg"
        );

    if (
        !toast ||
        !text
    ) {

        console.warn(
            "[EXAM]",
            message
        );

        return;
    }

    text.textContent =
        message;

    toast.classList.remove(
        "d-none"
    );

    void toast.offsetWidth;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimeout
    );

    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        toast.classList.add(
                            "d-none"
                        );

                    },
                    350
                );

            },
            4000
        );
}


/* =========================================================
EXAM LOAD ERROR
========================================================= */

function showExamLoadError(
    message
) {

    console.error(
        "[EXAM ERROR]",
        message
    );

    const startScreen =
        document.getElementById(
            "startScreen"
        );

    if (!startScreen) {
        return;
    }

    const card =
        startScreen.querySelector(
            ".exam-intro-card"
        );

    if (!card) {
        return;
    }

    let errorBox =
        document.getElementById(
            "examLoadError"
        );

    if (!errorBox) {

        errorBox =
            document.createElement(
                "div"
            );

        errorBox.id =
            "examLoadError";

        errorBox.className =
            "exam-warning-box mt-3";

        card.appendChild(
            errorBox
        );
    }

    errorBox.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill"></i>
        <p>${escapeHtml(message)}</p>
    `;
}


function hideExamLoadError() {

    const errorBox =
        document.getElementById(
            "examLoadError"
        );

    if (errorBox) {
        errorBox.remove();
    }
}


/* =========================================================
BUTTON LOADING
========================================================= */

function setButtonLoading(
    id,
    loading,
    text
) {

    const button =
        document.getElementById(
            id
        );

    if (!button) {
        return;
    }

    if (loading) {

        if (
            !button.dataset.originalHtml
        ) {

            button.dataset.originalHtml =
                button.innerHTML;
        }

        button.disabled =
            true;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${escapeHtml(text)}
        `;

    } else {

        button.disabled =
            false;

        if (
            button.dataset.originalHtml
        ) {

            button.innerHTML =
                button.dataset.originalHtml;

        } else {

            button.textContent =
                text;
        }
    }
}


/* =========================================================
TIMESPAN
========================================================= */

function parseTimeSpanToSeconds(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (
        typeof value === "number"
    ) {
        return value;
    }

    let str =
        String(value).trim();

    let days = 0;

    const firstColon =
        str.indexOf(":");

    const firstDot =
        str.indexOf(".");

    if (
        firstDot !== -1 &&
        firstColon !== -1 &&
        firstDot < firstColon
    ) {

        days =
            Number(
                str.slice(
                    0,
                    firstDot
                )
            ) || 0;

        str =
            str.slice(
                firstDot + 1
            );
    }

    const parts =
        str
            .split(":")
            .map(
                part =>
                    Number(
                        part.split(".")[0]
                    ) || 0
            );

    if (
        parts.length === 3
    ) {

        const [
            hours,
            minutes,
            seconds
        ] = parts;

        return (
            days * 86400 +
            hours * 3600 +
            minutes * 60 +
            seconds
        );
    }

    if (
        parts.length === 2
    ) {

        const [
            minutes,
            seconds
        ] = parts;

        return (
            days * 86400 +
            minutes * 60 +
            seconds
        );
    }

    const numeric =
        Number(str);

    return Number.isNaN(numeric)
        ? 0
        : numeric;
}


function formatDuration(
    seconds
) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    if (hours > 0) {

        return `${hours} ساعة و ${minutes} دقيقة`;
    }

    return `${minutes} دقيقة`;
}


function formatTimer(
    seconds
) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const remaining =
        seconds % 60;

    if (hours > 0) {

        return [
            pad(hours),
            pad(minutes),
            pad(remaining)
        ].join(":");
    }

    return [
        pad(minutes),
        pad(remaining)
    ].join(":");
}


function pad(
    number
) {

    return String(
        number
    ).padStart(
        2,
        "0"
    );
}


/* =========================================================
QUESTION TYPE
========================================================= */

function normalizeQuestionType(
    type
) {

    if (
        type === null ||
        type === undefined
    ) {
        return "سؤال";
    }

    if (
        typeof type === "number"
    ) {

        switch (type) {

            case 0:
                return "اختيار من متعدد";

            case 1:
                return "صح أو خطأ";

            default:
                return "سؤال";
        }
    }

    const value =
        String(type)
            .toLowerCase();

    if (
        value.includes("true") ||
        value.includes("false") ||
        value.includes("boolean") ||
        value.includes("truefalse")
    ) {

        return "صح أو خطأ";
    }

    if (
        value.includes("mcq") ||
        value.includes("choice") ||
        value.includes("multiple")
    ) {

        return "اختيار من متعدد";
    }

    return String(type);
}


function isTrueFalseQuestion(
    question
) {

    return (
        normalizeQuestionType(
            getQuestionType(
                question
            )
        ) ===
        "صح أو خطأ"
    );
}


/* =========================================================
QUESTION HELPERS
========================================================= */

function getQuestionId(
    question
) {

    if (!question) {
        return null;
    }

    return (
        question.questionId ??
        question.QuestionId ??
        question.id ??
        question.Id ??
        null
    );
}


function getQuestionTitle(
    question
) {

    if (!question) {
        return "";
    }

    return (
        question.questionTitle ??
        question.QuestionTitle ??
        question.title ??
        question.Title ??
        question.questionText ??
        question.QuestionText ??
        question.text ??
        question.Text ??
        ""
    );
}


function getQuestionType(
    question
) {

    if (!question) {
        return null;
    }

    return (
        question.questionType ??
        question.QuestionType ??
        question.type ??
        question.Type ??
        null
    );
}


function getQuestionChoices(
    question
) {

    if (!question) {
        return [];
    }

    if (
        Array.isArray(
            question.choices
        )
    ) {
        return question.choices;
    }

    if (
        Array.isArray(
            question.Choices
        )
    ) {
        return question.Choices;
    }

    return [];
}


function getChoiceId(
    choice
) {

    if (!choice) {
        return "";
    }

    return (
        choice.choiseId ??
        choice.ChoiseId ??
        choice.choiceId ??
        choice.ChoiceId ??
        choice.id ??
        choice.Id ??
        ""
    );
}


function getChoiceText(
    choice
) {

    if (!choice) {
        return "";
    }

    return (
        choice.text ??
        choice.Text ??
        choice.choiceText ??
        choice.ChoiceText ??
        choice.choiceName ??
        choice.ChoiceName ??
        choice.name ??
        choice.Name ??
        ""
    );
}


function getArabicChoiceLetter(
    index
) {

    const letters = [
        "أ",
        "ب",
        "ج",
        "د",
        "هـ",
        "و"
    ];

    return (
        letters[index] ||
        String(index + 1)
    );
}


/* =========================================================
DOM HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.textContent =
            value ?? "—";
    }
}


function showElement(
    id,
    show
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.classList.toggle(
        "d-none",
        !show
    );
}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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


/* =========================================================
QUESTION NAVIGATOR TOGGLE
========================================================= */

function toggleQuestionNavigator() {

    const qnav =
        document.getElementById(
            "qnav"
        );

    if (!qnav) return;

    qnav.classList.toggle(
        "open"
    );

    const toggle =
        document.getElementById(
            "qnavToggle"
        );

    if (toggle) {

        toggle.setAttribute(
            "aria-expanded",
            qnav.classList.contains(
                "open"
            )
        );
    }
}


function closeQuestionNavigator() {

    const qnav =
        document.getElementById(
            "qnav"
        );

    if (qnav) {

        qnav.classList.remove(
            "open"
        );
    }

    const toggle =
        document.getElementById(
            "qnavToggle"
        );

    if (toggle) {

        toggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


/* =========================================================
EVENTS
========================================================= */

function bindExamEvents() {

    const startButton =
        document.getElementById(
            "startExamBtn"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            openExam
        );
    }


    const submitButton =
        document.getElementById(
            "submitExamBtn"
        );

    if (submitButton) {

        submitButton.addEventListener(
            "click",
            () => {

                if (
                    examSubmitted
                ) {
                    return;
                }

                if (
                    allQuestionsAnswered()
                ) {

                    openSubmitModal();

                    return;
                }

                const unanswered =
                    questions.length -
                    Object.keys(
                        answers
                    ).length;

                showExamToast(
                    `متبقي ${unanswered} سؤال بدون إجابة.`
                );

                highlightUnansweredQuestions();
            }
        );
    }


    const confirmButton =
        document.getElementById(
            "confirmSubmitBtn"
        );

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                submitExam(false);
            }
        );
    }


    const cancelButton =
        document.getElementById(
            "cancelSubmitBtn"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeSubmitModal
        );
    }


    const qnavToggle =
        document.getElementById(
            "qnavToggle"
        );

    if (qnavToggle) {

        qnavToggle.addEventListener(
            "click",
            toggleQuestionNavigator
        );
    }


    const modal =
        document.getElementById(
            "confirmModalBackdrop"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeSubmitModal();
                }
            }
        );
    }
}


/* =========================================================
ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeSubmitModal();

            closeQuestionNavigator();
        }
    }
);


/* =========================================================
DEBUG / EXPORT
========================================================= */

window.BubbleSheetExam = {

    getExamId:
        () => examId,

    getSubjectId:
        () => subjectId,

    getAttemptId:
        () => attemptId,

    getAnswers:
        () => ({ ...answers }),

    getQuestions:
        () => [...questions],

    getExamDetails:
        () => examDetails,

    getExamData:
        () => examData,

    getCurrentQuestionIndex:
        () => currentQuestionIndex,

    getViolationCount:
        () => violationCount,

    isSubmitted:
        () => examSubmitted
};