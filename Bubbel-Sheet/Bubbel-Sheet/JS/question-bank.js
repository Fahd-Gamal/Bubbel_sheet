/* =========================================================
   BUBBLE SHEET — QUESTION BANK.JS
   REAL API INTEGRATION

   IMPORTANT:
   - get-QuestionBank is called BEFORE starting only.
   - open-QuestionBank is called ONLY after "ابدأ الحل".
   - Questions are NEVER loaded before starting.
   - One answer only per question.
   - Correct / Wrong answers are shown AFTER submission.
   - No timer.
   - No violation caused by selecting an answer.
   - After 5 violations (leaving the tab/window), the bank
     is auto-submitted — same idea as exam.js.
========================================================= */


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initQuestionBankPage();
});


/* =========================================================
   CONFIG
========================================================= */

const QUESTION_BANK_API = "/QuestionBank";

const TOAST_DURATION_MS = 3500;

// Same threshold/behavior as exam.js: after this many
// violations, the bank is submitted automatically.
const MAX_VIOLATIONS = 5;


/* =========================================================
   STATE
========================================================= */

const state = {

    bankLoaded: false,

    examStarted: false,

    examSubmitted: false,

    questionsLoaded: false,

    attemptId: null,

    bankId: null,

    currentAnswers: {},

    activeQuestionId: null,

    questionBank: null,

    bankDetails: null,

    violationCount: 0,

    visibilityViolationLock: false,

    isSubmitting: false
};


/* =========================================================
   DOM
========================================================= */

const els = {};


/* =========================================================
   INIT
========================================================= */

async function initQuestionBankPage() {

    cacheDom();

    bindStaticEvents();

    const bankId = getQuestionBankId();

    if (!bankId) {

        showToast(
            "لم يتم تحديد بنك الأسئلة."
        );

        return;
    }

    state.bankId = Number(bankId);

    console.log(
        "Initializing Question Bank..."
    );

    console.log(
        "Question Bank ID:",
        state.bankId
    );

    /*
       IMPORTANT:

       هنا لا نستخدم open-QuestionBank.

       نجيب بيانات البنك فقط.
       الأسئلة نفسها لن تأتي إلا بعد الضغط
       على ابدأ الحل.
    */

    await loadQuestionBankDetails(
        state.bankId
    );
}


/* =========================================================
   CACHE DOM
========================================================= */

function cacheDom() {

    els.startScreen =
        document.getElementById("startScreen");

    els.examScreen =
        document.getElementById("examScreen");

    els.resultScreen =
        document.getElementById("resultScreen");


    els.startExamBtn =
        document.getElementById("startExamBtn");


    els.startExamName =
        document.getElementById("startExamName");

    els.metaSubject =
        document.getElementById("metaSubject");

    els.metaYear =
        document.getElementById("metaYear");

    els.metaCount =
        document.getElementById("metaCount");

    els.metaDescription =
        document.getElementById("metaDescription");


    els.examTitle =
        document.getElementById("examTitle");

    els.examSubMeta =
        document.getElementById("examSubMeta");


    els.questionsContainer =
        document.getElementById("questionsContainer");


    els.submitExamBtn =
        document.getElementById("submitExamBtn");


    els.examProgressFill =
        document.getElementById("examProgressFill");

    els.examProgressText =
        document.getElementById("examProgressText");

    els.examProgressPercent =
        document.getElementById("examProgressPercent");

    els.examProgress =
        document.getElementById("examProgress");


    els.qnav =
        document.getElementById("qnav");

    els.qnavToggle =
        document.getElementById("qnavToggle");

    els.qnavPanel =
        document.getElementById("qnavPanel");

    els.qnavGrid =
        document.getElementById("qnavGrid");


    els.confirmModalBackdrop =
        document.getElementById("confirmModalBackdrop");

    els.cancelSubmitBtn =
        document.getElementById("cancelSubmitBtn");

    els.confirmSubmitBtn =
        document.getElementById("confirmSubmitBtn");


    els.examToast =
        document.getElementById("examToast");

    els.examToastMsg =
        document.getElementById("examToastMsg");


    els.resultScoreText =
        document.getElementById("resultScoreText");

    els.resultPercentageText =
        document.getElementById("resultPercentageText");

    els.reviewAnswersBtn =
        document.getElementById("reviewAnswersBtn");
}


/* =========================================================
   STATIC EVENTS
========================================================= */

function bindStaticEvents() {

    /*
       START
    */

    if (els.startExamBtn) {

        els.startExamBtn.addEventListener(
            "click",
            startQuestionBank
        );
    }


    /*
       SUBMIT
    */

    if (els.submitExamBtn) {

        els.submitExamBtn.addEventListener(
            "click",
            onSubmitClick
        );
    }


    /*
       CANCEL MODAL
    */

    if (els.cancelSubmitBtn) {

        els.cancelSubmitBtn.addEventListener(
            "click",
            closeConfirmModal
        );
    }


    /*
       CONFIRM SUBMIT
    */

    if (els.confirmSubmitBtn) {

        els.confirmSubmitBtn.addEventListener(
            "click",
            async function () {

                console.log("CONFIRM SUBMIT CLICKED");

                closeConfirmModal();

                console.log("CALLING submitQuestionBank");

                await submitQuestionBank();
            }
        );
    }


    /*
       MODAL BACKDROP
    */

    if (els.confirmModalBackdrop) {

        els.confirmModalBackdrop.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    els.confirmModalBackdrop
                ) {

                    closeConfirmModal();
                }
            }
        );
    }


    /*
       REVIEW
    */

    if (els.reviewAnswersBtn) {

        els.reviewAnswersBtn.addEventListener(
            "click",
            function () {

                if (!state.questionsLoaded) {
                    return;
                }

                const firstQuestion =
                    state.questionBank?.questions?.[0];

                if (!firstQuestion) {
                    return;
                }

                /*
                   Hide result screen so the student
                   can review the questions.
                */

                if (els.resultScreen) {

                    els.resultScreen.classList.add(
                        "d-none"
                    );
                }

                if (els.examScreen) {

                    els.examScreen.classList.remove(
                        "d-none"
                    );
                }

                if (els.qnav) {

                    els.qnav.classList.remove(
                        "d-none"
                    );
                }

                scrollToQuestion(
                    firstQuestion.questionId
                );
            }
        );
    }


    /*
       QUESTION NAV
    */

    if (els.qnavToggle) {

        els.qnavToggle.addEventListener(
            "click",
            function () {

                if (!els.qnav) {
                    return;
                }

                const isOpen =
                    els.qnav.classList.toggle(
                        "open"
                    );

                els.qnavToggle.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );
            }
        );
    }
}


/* =========================================================
   GET QUESTION BANK ID
========================================================= */

function getQuestionBankId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("QBankId") ||
        params.get("qBankId") ||
        params.get("bankId")
    );
}


/* =========================================================
   LOAD BANK DETAILS
   IMPORTANT:
   This endpoint does NOT return the questions.
========================================================= */

async function loadQuestionBankDetails(bankId) {

    try {

        console.log(
            "Loading Question Bank Details:",
            bankId
        );


        const endpoint =
            `${QUESTION_BANK_API}/get-QuestionBank?QBankId=${encodeURIComponent(bankId)}`;


        const response =
            await apiRequest(
                endpoint,
                {
                    method: "GET"
                }
            );


        console.log(
            "Question Bank Details Response:",
            response
        );


        if (!response.ok) {

            if (response.status === 401) {

                throw new Error(
                    "غير مصرح لك. برجاء تسجيل الدخول مرة أخرى."
                );
            }


            let errorText = "";

            try {

                errorText =
                    await response.text();

            } catch (_) {}


            throw new Error(
                errorText ||
                `فشل تحميل بيانات بنك الأسئلة (${response.status})`
            );
        }


        const data =
            await response.json();


        console.log(
            "Question Bank Details:",
            data
        );


        if (!data) {

            throw new Error(
                "لم يتم العثور على بيانات بنك الأسئلة."
            );
        }


        /*
           Save only DETAILS.
           No questions are saved here.
        */

        state.bankDetails = data;

        state.bankLoaded = true;


        renderStartScreenMeta();


    } catch (error) {

        console.error(
            "Question Bank Details Error:",
            error
        );


        showToast(
            error.message ||
            "حدث خطأ أثناء تحميل بيانات بنك الأسئلة."
        );
    }
}


/* =========================================================
   OPEN QUESTION BANK
   ONLY AFTER START
========================================================= */

async function openQuestionBank() {

    try {

        const endpoint =
            `${QUESTION_BANK_API}/open-QuestionBank?QBankId=${encodeURIComponent(state.bankId)}`;


        console.log(
            "Opening Question Bank:",
            endpoint
        );


        const response =
            await apiRequest(
                endpoint,
                {
                    method: "GET"
                }
            );


        console.log(
            "Question Bank Response:",
            response
        );


        if (!response.ok) {

            if (response.status === 401) {

                throw new Error(
                    "غير مصرح لك بفتح بنك الأسئلة. تأكد من تسجيل الدخول."
                );
            }


            let errorText = "";

            try {

                errorText =
                    await response.text();

            } catch (_) {}


            throw new Error(
                errorText ||
                `فشل فتح بنك الأسئلة (${response.status})`
            );
        }


        const data =
            await response.json();


        console.log(
            "Question Bank Data:",
            data
        );


        if (
            !data ||
            !Array.isArray(data.questions) ||
            data.questions.length === 0
        ) {

            throw new Error(
                "لم يتم العثور على أسئلة في بنك الأسئلة."
            );
        }


        /*
           Now and only now questions are stored.
        */

        state.questionBank = data;

        state.attemptId =
            Number(data.attemptId);

        state.questionsLoaded = true;


        normalizeQuestionBank();


        console.log(
            "Attempt ID:",
            state.attemptId
        );

        console.log(
            "Questions:",
            state.questionBank.questions
        );


        return true;


    } catch (error) {

        console.error(
            "Open Question Bank Error:",
            error
        );


        showToast(
            error.message ||
            "حدث خطأ أثناء فتح بنك الأسئلة."
        );


        return false;
    }
}


/* =========================================================
   NORMALIZE QUESTION BANK
========================================================= */

function normalizeQuestionBank() {

    if (!state.questionBank) {
        return;
    }


    state.questionBank.questions =
        state.questionBank.questions.map(
            function (question) {

                return {

                    ...question,

                    questionId:
                        Number(
                            question.questionId
                        ),

                    questionTitle:
                        question.questionTitle ||
                        "",

                    questionType:
                        question.questionType ??
                        0,

                    imgLink:
                        question.imgLink ||
                        null,

                    choices:
                        Array.isArray(
                            question.choices
                        )
                            ? question.choices.map(
                                function (choice) {

                                    return {

                                        ...choice,

                                        /*
                                           Backend typo:
                                           choiseId

                                           Keep compatibility with it.
                                        */

                                        choiseId:
                                            Number(
                                                choice.choiseId
                                            ),

                                        isCorrect:
                                            Boolean(
                                                choice.isCorrect
                                            )
                                    };
                                }
                            )
                            : []
                };
            }
        );
}


/* =========================================================
   START SCREEN META
========================================================= */

function renderStartScreenMeta() {

    const bank =
        state.bankDetails;


    if (!bank) {
        return;
    }


    /*
       NAME
    */

    if (els.startExamName) {

        els.startExamName.textContent =
            bank.bankName ||
            "بنك الأسئلة";
    }


    /*
       SUBJECT

       get-QuestionBank الحالي لا يرجع subjectName.
       لذلك نحاول من أكثر من مصدر بدون افتراض قيمة.
    */

    const subjectName =
        bank.subjectName ||
        bank.subject ||
        localStorage.getItem(
            "questionBankSubjectName"
        ) ||
        localStorage.getItem(
            "subjectName"
        ) ||
        "—";


    if (els.metaSubject) {

        els.metaSubject.textContent =
            subjectName;
    }


    /*
       ACADEMIC YEAR
    */

    const academicYear =
        bank.academicYearName ||
        bank.academicYear ||
        localStorage.getItem(
            "academicYearName"
        ) ||
        "—";


    if (els.metaYear) {

        els.metaYear.textContent =
            academicYear;
    }


    /*
       COUNT

       هنا نستخدم qCount من الـ details endpoint
       وليس questions.length لأن الأسئلة لم يتم فتحها بعد.
    */

    const count =
        Number(
            bank.qCount ??
            bank.questionCount ??
            0
        );


    if (els.metaCount) {

        els.metaCount.textContent =
            count > 0
                ? count + " سؤال"
                : "—";
    }


    /*
       DESCRIPTION
    */

    const description =
        bank.description ||
        "لا يوجد وصف لهذا البنك.";


    if (els.metaDescription) {

        els.metaDescription.textContent =
            description;
    }
    else {

        createDescriptionElement(
            description
        );
    }
}


/* =========================================================
   DESCRIPTION
========================================================= */

function createDescriptionElement(
    description
) {

    if (!els.startExamName) {
        return;
    }


    let element =
        document.getElementById(
            "dynamicBankDescription"
        );


    if (!element) {

        element =
            document.createElement("p");


        element.id =
            "dynamicBankDescription";


        element.className =
            "ay-subtitle question-bank-description";


        els.startExamName.insertAdjacentElement(
            "afterend",
            element
        );
    }


    element.textContent =
        description;
}


/* =========================================================
   START QUESTION BANK
========================================================= */

async function startQuestionBank() {

    if (
        state.examStarted ||
        !state.bankLoaded
    ) {

        return;
    }


    /*
       Disable button immediately
       to prevent double click.
    */

    if (els.startExamBtn) {

        els.startExamBtn.disabled =
            true;

        els.startExamBtn.classList.add(
            "loading"
        );
    }


    /*
       THIS IS THE ONLY PLACE
       WHERE open-QuestionBank IS CALLED.
    */

    const opened =
        await openQuestionBank();


    if (!opened) {

        if (els.startExamBtn) {

            els.startExamBtn.disabled =
                false;

            els.startExamBtn.classList.remove(
                "loading"
            );
        }

        return;
    }


    state.examStarted =
        true;

    // Fresh violation count every time a new attempt starts.
    state.violationCount = 0;
    state.visibilityViolationLock = false;


    /*
       Hide start screen
    */

    if (els.startScreen) {

        els.startScreen.classList.add(
            "exam-fade-out"
        );
    }


    window.setTimeout(
        function () {

            if (els.startScreen) {

                els.startScreen.classList.add(
                    "d-none"
                );
            }


            if (els.examScreen) {

                els.examScreen.classList.remove(
                    "d-none"
                );
            }


            if (els.qnav) {

                els.qnav.classList.remove(
                    "d-none"
                );
            }


            renderExamHeader();

            renderQuestions();

            buildSidebarNav();

            setupScrollSpy();

            updateExamProgress();


            if (els.startExamBtn) {

                els.startExamBtn.disabled =
                    false;

                els.startExamBtn.classList.remove(
                    "loading"
                );
            }

        },
        320
    );
}


/* =========================================================
   EXAM HEADER
========================================================= */

function renderExamHeader() {

    const bank =
        state.questionBank;


    if (!bank) {
        return;
    }


    if (els.examTitle) {

        els.examTitle.textContent =
            bank.bankName ||
            "بنك الأسئلة";
    }


    const subject =
        bank.subjectName ||
        bank.subject ||
        state.bankDetails?.subjectName ||
        localStorage.getItem(
            "questionBankSubjectName"
        ) ||
        "";


    const year =
        bank.academicYearName ||
        bank.academicYear ||
        state.bankDetails?.academicYearName ||
        localStorage.getItem(
            "academicYearName"
        ) ||
        "";


    const parts = [];


    if (subject) {
        parts.push(subject);
    }


    if (year) {
        parts.push(year);
    }


    if (els.examSubMeta) {

        els.examSubMeta.textContent =
            parts.join(" • ");
    }
}


/* =========================================================
   QUESTIONS
========================================================= */

function renderQuestions() {

    if (
        !state.questionBank ||
        !Array.isArray(
            state.questionBank.questions
        )
    ) {

        return;
    }


    const fragment =
        document.createDocumentFragment();


    state.questionBank.questions.forEach(
        function (question, index) {

            fragment.appendChild(
                buildQuestionCard(
                    question,
                    index + 1
                )
            );
        }
    );


    if (els.questionsContainer) {

        els.questionsContainer.innerHTML =
            "";

        els.questionsContainer.appendChild(
            fragment
        );
    }
}


/* =========================================================
   BUILD QUESTION CARD
========================================================= */

function buildQuestionCard(
    question,
    displayNumber
) {

    const card =
        document.createElement("article");


    card.className =
        "gc question-card";


    card.id =
        "q-" +
        question.questionId;


    card.setAttribute(
        "data-question-id",
        String(question.questionId)
    );


    /*
       HEADER
    */

    const head =
        document.createElement("div");


    head.className =
        "question-head";


    const badge =
        document.createElement("span");


    badge.className =
        "question-badge";


    badge.textContent =
        displayNumber;


    head.appendChild(
        badge
    );


    card.appendChild(
        head
    );


    /*
       QUESTION
    */

    const text =
        document.createElement("p");


    text.className =
        "question-text";


    text.textContent =
        question.questionTitle;


    card.appendChild(
        text
    );


    /*
       IMAGE
    */

    if (question.imgLink) {

        const imageWrap =
            document.createElement("div");


        imageWrap.className =
            "question-image";


        const img =
            document.createElement("img");


        img.src =
            question.imgLink;


        img.alt =
            "صورة السؤال " +
            displayNumber;


        img.draggable =
            false;


        img.loading =
            "lazy";


        imageWrap.appendChild(
            img
        );


        card.appendChild(
            imageWrap
        );
    }


    /*
       OPTIONS
    */

    const options =
        buildOptionsForQuestion(
            question,
            displayNumber
        );


    card.appendChild(
        options
    );


    /*
       FEEDBACK
    */

    const feedback =
        document.createElement("div");


    feedback.className =
        "question-feedback d-none";


    feedback.id =
        "feedback-" +
        question.questionId;


    card.appendChild(
        feedback
    );


    return card;
}


/* =========================================================
   ARABIC OPTION LETTERS
========================================================= */

const ARABIC_OPTION_LETTERS = [
    "أ",
    "ب",
    "ج",
    "د",
    "هـ",
    "و",
    "ز",
    "ح"
];


function getArabicOptionLetter(index) {

    return (
        ARABIC_OPTION_LETTERS[index] ||
        String(index + 1)
    );
}


/* =========================================================
   BUILD OPTIONS
========================================================= */

function buildOptionsForQuestion(
    question,
    displayNumber
) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "question-options";


    wrapper.setAttribute(
        "role",
        "radiogroup"
    );


    wrapper.setAttribute(
        "aria-label",
        "خيارات السؤال " +
        displayNumber
    );


    question.choices.forEach(
        function (choice, index) {

            wrapper.appendChild(
                buildOptionItem(
                    question,
                    choice,
                    index
                )
            );
        }
    );


    return wrapper;
}


/* =========================================================
   BUILD OPTION
========================================================= */

function buildOptionItem(
    question,
    choice,
    index
) {

    const choiceId =
        Number(choice.choiseId);


    const label =
        document.createElement("label");


    label.className =
        "option-item";


    label.setAttribute(
        "data-choice-id",
        String(choiceId)
    );


    /*
       RADIO

       ONE NAME PER QUESTION.

       Therefore:
       question 1 => question-2
       question 2 => question-3

       This prevents selecting multiple
       answers inside the same question.
    */

    const input =
        document.createElement("input");


    input.type =
        "radio";


    input.className =
        "option-input";


    input.name =
        "question-" +
        String(question.questionId);


    input.value =
        String(choiceId);


    input.setAttribute(
        "data-question-id",
        String(question.questionId)
    );


    input.setAttribute(
        "data-choice-id",
        String(choiceId)
    );


    /*
       IMPORTANT:

       Selecting an answer is NOT a violation.
    */

    input.addEventListener(
        "change",
        function () {

            if (!input.checked) {
                return;
            }


            handleOptionSelect(
                question.questionId,
                choiceId
            );
        }
    );


    /*
       MARKER
    */

    const marker =
        document.createElement("span");


    marker.className =
        "option-marker option-marker--letter";


    marker.setAttribute(
        "aria-hidden",
        "true"
    );


    marker.textContent =
        getArabicOptionLetter(index);


    /*
       TEXT
    */

    const text =
        document.createElement("span");


    text.className =
        "option-text";


    text.textContent =
        choice.text;


    /*
       ASSEMBLE
    */

    label.appendChild(
        input
    );

    label.appendChild(
        marker
    );

    label.appendChild(
        text
    );


    return label;
}


/* =========================================================
   ANSWER SELECTION
========================================================= */

function handleOptionSelect(
    questionId,
    choiceId
) {

    if (
        state.examSubmitted ||
        !state.examStarted
    ) {

        return;
    }


    const qId =
        String(questionId);


    const cId =
        Number(choiceId);


    /*
       ONE ANSWER ONLY
    */

    state.currentAnswers[qId] =
        cId;


    const card =
        document.getElementById(
            "q-" + qId
        );


    if (!card) {
        return;
    }


    /*
       Remove selected class
       from every option.
    */

    card.querySelectorAll(
        ".option-item"
    ).forEach(
        function (item) {

            const itemChoiceId =
                Number(
                    item.getAttribute(
                        "data-choice-id"
                    )
                );


            item.classList.toggle(
                "is-selected",
                itemChoiceId === cId
            );
        }
    );


    /*
       Extra safety:
       only ONE radio remains checked.
    */

    card.querySelectorAll(
        ".option-input"
    ).forEach(
        function (input) {

            input.checked =
                Number(input.value) === cId;
        }
    );


    console.log(
        "Answer selected:",
        {
            questionId: Number(questionId),
            choiceId: cId
        }
    );


    updateQnavItemState(
        questionId
    );


    updateExamProgress();
}


/* =========================================================
   PROGRESS
========================================================= */

function updateExamProgress() {

    const totalCount =
        state.questionBank?.questions?.length ||
        0;


    const answeredCount =
        Object.keys(
            state.currentAnswers
        ).length;


    const percentage =
        totalCount
            ? Math.round(
                (
                    answeredCount /
                    totalCount
                ) * 100
            )
            : 0;


    if (els.examProgressFill) {

        els.examProgressFill.style.width =
            percentage + "%";
    }


    if (els.examProgressText) {

        els.examProgressText.textContent =
            answeredCount +
            " من " +
            totalCount +
            " أسئلة";
    }


    if (els.examProgressPercent) {

        els.examProgressPercent.textContent =
            percentage + "%";
    }


    if (els.examProgress) {

        els.examProgress.setAttribute(
            "aria-valuenow",
            String(percentage)
        );
    }
}


/* =========================================================
   SIDEBAR
========================================================= */

function buildSidebarNav() {

    if (!els.qnavGrid) {
        return;
    }


    const fragment =
        document.createDocumentFragment();


    state.questionBank.questions.forEach(
        function (question, index) {

            const btn =
                document.createElement("button");


            btn.type =
                "button";


            btn.className =
                "qnav-item";


            btn.id =
                "qnav-item-" +
                question.questionId;


            btn.textContent =
                index + 1;


            btn.setAttribute(
                "role",
                "listitem"
            );


            btn.setAttribute(
                "aria-label",
                "الذهاب إلى السؤال " +
                (index + 1)
            );


            btn.addEventListener(
                "click",
                function () {

                    scrollToQuestion(
                        question.questionId
                    );
                }
            );


            fragment.appendChild(
                btn
            );
        }
    );


    els.qnavGrid.innerHTML =
        "";


    els.qnavGrid.appendChild(
        fragment
    );
}


/* =========================================================
   SIDEBAR STATE
========================================================= */

function updateQnavItemState(
    questionId
) {

    const item =
        document.getElementById(
            "qnav-item-" +
            questionId
        );


    if (!item) {
        return;
    }


    item.classList.toggle(
        "answered",
        Object.prototype.hasOwnProperty.call(
            state.currentAnswers,
            String(questionId)
        )
    );
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToQuestion(
    questionId
) {

    const card =
        document.getElementById(
            "q-" + questionId
        );


    if (!card) {
        return;
    }


    card.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    card.setAttribute(
        "tabindex",
        "-1"
    );


    try {

        card.focus({
            preventScroll: true
        });

    } catch (_) {}


    if (window.innerWidth <= 768) {

        closeQnavPanel();
    }
}


function closeQnavPanel() {

    if (!els.qnav) {
        return;
    }


    els.qnav.classList.remove(
        "open"
    );


    if (els.qnavToggle) {

        els.qnavToggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


/* =========================================================
   SCROLL SPY
========================================================= */

function setupScrollSpy() {

    const cards =
        document.querySelectorAll(
            ".question-card"
        );


    if (!cards.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            setActiveQuestion(
                                entry.target.getAttribute(
                                    "data-question-id"
                                )
                            );
                        }
                    }
                );
            },
            {
                root: null,

                rootMargin:
                    "-40% 0px -50% 0px",

                threshold: 0
            }
        );


    cards.forEach(
        function (card) {

            observer.observe(
                card
            );
        }
    );
}


function setActiveQuestion(
    questionId
) {

    if (
        state.activeQuestionId ===
        questionId
    ) {

        return;
    }


    const previous =
        document.getElementById(
            "qnav-item-" +
            state.activeQuestionId
        );


    if (previous) {

        previous.classList.remove(
            "current"
        );
    }


    state.activeQuestionId =
        questionId;


    const current =
        document.getElementById(
            "qnav-item-" +
            questionId
        );


    if (current) {

        current.classList.add(
            "current"
        );
    }
}


/* =========================================================
   VALIDATION
========================================================= */

function findFirstUnansweredQuestionId() {

    if (
        !state.questionBank ||
        !Array.isArray(
            state.questionBank.questions
        )
    ) {

        return null;
    }


    for (
        let i = 0;
        i <
        state.questionBank.questions.length;
        i++
    ) {

        const question =
            state.questionBank.questions[i];


        if (
            !Object.prototype.hasOwnProperty.call(
                state.currentAnswers,
                String(question.questionId)
            )
        ) {

            return question.questionId;
        }
    }


    return null;
}


/* =========================================================
   HIGHLIGHT UNANSWERED
========================================================= */

function highlightUnanswered(
    questionId
) {

    const card =
        document.getElementById(
            "q-" + questionId
        );


    if (!card) {
        return;
    }


    card.classList.add(
        "unanswered-shake"
    );


    window.setTimeout(
        function () {

            card.classList.remove(
                "unanswered-shake"
            );

        },
        900
    );
}


/* =========================================================
   SUBMIT CLICK
========================================================= */

function onSubmitClick() {

    console.log("SUBMIT BUTTON CLICKED");

    if (
        !state.examStarted ||
        !state.questionsLoaded
    ) {

        return;
    }


    const firstUnansweredId =
        findFirstUnansweredQuestionId();


    if (firstUnansweredId !== null) {

        scrollToQuestion(
            firstUnansweredId
        );


        highlightUnanswered(
            firstUnansweredId
        );


        showToast(
            "من فضلك أجب على جميع الأسئلة قبل الإرسال."
        );


        return;
    }


    openConfirmModal();
}


/* =========================================================
   CONFIRM MODAL
========================================================= */

function openConfirmModal() {

    console.log("OPENING SUBMIT CONFIRMATION MODAL");

    if (!els.confirmModalBackdrop) {
        return;
    }


    els.confirmModalBackdrop.classList.remove(
        "d-none"
    );
}


function closeConfirmModal() {

    if (!els.confirmModalBackdrop) {
        return;
    }


    els.confirmModalBackdrop.classList.add(
        "d-none"
    );
}


/* =========================================================
   BUILD SUBMIT DTO
========================================================= */

function buildSubmitDto() {

    console.log("BUILDING SUBMIT DTO");

    const answers = [];


    state.questionBank.questions.forEach(
        function (question) {

            const questionId =
                Number(
                    question.questionId
                );

            const qKey =
                String(questionId);

            /*
               A violation-triggered auto-submit can fire
               before every question is answered. Skip any
               question with no recorded answer instead of
               sending ChoiceId: null — the server rejects
               that with a 400 ("could not be converted to
               System.Int32").
            */

            if (
                !Object.prototype.hasOwnProperty.call(
                    state.currentAnswers,
                    qKey
                )
            ) {
                return;
            }

            const choiceId =
                Number(
                    state.currentAnswers[qKey]
                );

            if (Number.isNaN(choiceId)) {
                return;
            }


            answers.push({

                QuestionId:
                    questionId,

                ChoiceId:
                    choiceId
            });
        }
    );


    const dto = {

        StudentAttemptId:
            Number(state.attemptId),

        Answers:
            answers
    };

    console.log("SUBMIT DTO:", dto);

    return dto;
}


/* =========================================================
   SUBMIT
========================================================= */

async function submitQuestionBank() {

    console.log("submitQuestionBank STARTED");

    if (
        state.examSubmitted ||
        state.isSubmitting
    ) {

        console.log("Submit blocked:", {
            examSubmitted: state.examSubmitted,
            isSubmitting: state.isSubmitting
        });

        return;
    }


    console.log("Attempt ID:", state.attemptId);

    if (!state.attemptId) {

        console.log("Submit blocked: no attemptId");

        showToast(
            "لم يتم العثور على محاولة بنك الأسئلة."
        );

        return;
    }


    state.isSubmitting = true;


    try {

        const payload =
            buildSubmitDto();


        console.log(
            "Submitting Question Bank:",
            payload
        );


        console.log(
            "SENDING POST REQUEST:",
            `${QUESTION_BANK_API}/submit-QuestionBank`
        );


        const response =
            await apiRequest(
                `${QUESTION_BANK_API}/submit-QuestionBank`,
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


        console.log(
            "Submit Question Bank Response:",
            response
        );


        if (!response.ok) {

            let errorText = "";

            try {

                errorText =
                    await response.text();

            } catch (_) {}


            throw new Error(
                errorText ||
                `فشل إرسال الإجابات (${response.status})`
            );
        }


        const result =
            await response.json();


        console.log(
            "Question Bank Submit Result:",
            result
        );


        state.examSubmitted =
            true;


        /*
           IMPORTANT:

           First show correct/wrong answers
           BEFORE locking the inputs.
        */

        showCorrectWrongAnswers();


        lockAllQuestions();


        renderResults(
            result
        );


        closeQnavPanel();


        if (els.qnav) {

            els.qnav.classList.add(
                "d-none"
            );
        }


        if (els.resultScreen) {

            els.resultScreen.classList.remove(
                "d-none"
            );


            els.resultScreen.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }


    } catch (error) {

        console.error(
            "Submit Question Bank Error:",
            error
        );


        /*
           A raw "NetworkError when attempting to fetch resource"
           here almost always means the server responded with a
           500 that had no CORS headers (so the browser blocks
           reading it and reports it as a network failure, not
           as an HTTP error). Show the student something useful
           instead of the technical message.
        */

        const isNetworkLevelError =
            error instanceof TypeError ||
            /networkerror/i.test(
                error.message || ""
            ) ||
            /failed to fetch/i.test(
                error.message || ""
            );


        showToast(
            isNetworkLevelError
                ? "تعذر إرسال الإجابات بسبب مشكلة في الاتصال بالخادم. برجاء المحاولة مرة أخرى."
                : (
                    error.message ||
                    "حدث خطأ أثناء إرسال الإجابات."
                )
        );

    } finally {

        state.isSubmitting = false;
    }
}


/* =========================================================
   SHOW CORRECT / WRONG ANSWERS
   AFTER SUBMISSION ONLY

   RULES:
   - Correct answer       => GREEN
   - Selected + correct   => GREEN
   - Selected + wrong     => RED
   - Other answers        => NORMAL
========================================================= */

function showCorrectWrongAnswers() {

    if (
        !state.questionBank ||
        !Array.isArray(
            state.questionBank.questions
        )
    ) {
        return;
    }


    state.questionBank.questions.forEach(
        function (question) {

            const card =
                document.getElementById(
                    "q-" +
                    question.questionId
                );


            if (!card) {
                return;
            }


            const selectedChoiceId =
                Number(
                    state.currentAnswers[
                        String(
                            question.questionId
                        )
                    ]
                );


            /*
               Find the correct choice.
            */

            const correctChoice =
                question.choices.find(
                    function (choice) {

                        return Boolean(
                            choice.isCorrect
                        );
                    }
                );


            const correctChoiceId =
                correctChoice
                    ? Number(
                        correctChoice.choiseId
                    )
                    : null;


            /*
               Reset ALL answer classes first.
            */

            card
                .querySelectorAll(
                    ".option-item"
                )
                .forEach(
                    function (option) {

                        option.classList.remove(
                            "answer-correct",
                            "answer-wrong",
                            "answer-selected"
                        );
                    }
                );


            /*
               Apply final answer colors.
            */

            question.choices.forEach(
                function (choice) {

                    const choiceId =
                        Number(
                            choice.choiseId
                        );


                    const option =
                        card.querySelector(
                            `[data-choice-id="${choiceId}"]`
                        );


                    if (!option) {
                        return;
                    }


                    /*
                       =====================================
                       CORRECT ANSWER
                       ALWAYS GREEN
                       =====================================
                    */

                    if (
                        choiceId ===
                        correctChoiceId
                    ) {

                        option.classList.add(
                            "answer-correct"
                        );
                    }


                    /*
                       =====================================
                       STUDENT ANSWER
                       =====================================
                    */

                    if (
                        choiceId ===
                        selectedChoiceId
                    ) {

                        option.classList.add(
                            "answer-selected"
                        );


                        /*
                           Student selected the wrong answer.
                        */

                        if (
                            choiceId !==
                            correctChoiceId
                        ) {

                            option.classList.add(
                                "answer-wrong"
                            );
                        }
                    }
                }
            );


            /*
               =====================================
               FEEDBACK
               =====================================
            */

            const feedback =
                document.getElementById(
                    "feedback-" +
                    question.questionId
                );


            if (!feedback) {
                return;
            }


            feedback.classList.remove(
                "d-none",
                "feedback-correct",
                "feedback-wrong"
            );


            /*
               Correct
            */

            if (
                selectedChoiceId ===
                correctChoiceId
            ) {

                feedback.classList.add(
                    "feedback-correct"
                );


                feedback.innerHTML =
                    `
                    <i class="bi bi-check-circle-fill"></i>
                    <span>إجابة صحيحة</span>
                    `;
            }


            /*
               Wrong
            */

            else {

                feedback.classList.add(
                    "feedback-wrong"
                );


                feedback.innerHTML =
                    `
                    <i class="bi bi-x-circle-fill"></i>
                    <span>
                        إجابة خاطئة — تم توضيح الإجابة الصحيحة بالأخضر
                    </span>
                    `;
            }
        }
    );
}
/* =========================================================
   LOCK QUESTIONS
========================================================= */

function lockAllQuestions() {

    document
        .querySelectorAll(
            ".question-card"
        )
        .forEach(
            function (card) {

                card.classList.add(
                    "is-locked"
                );


                card
                    .querySelectorAll(
                        ".option-input"
                    )
                    .forEach(
                        function (input) {

                            input.disabled =
                                true;
                        }
                    );
            }
        );
}


/* =========================================================
   RESULTS
========================================================= */

function renderResults(result) {

    /*
       Backend response:

       {
           Score: int,
           precentage: int
       }

       ASP.NET Core usually serializes
       properties as camelCase unless configured otherwise.
    */


    const score =
        Number(
            result?.score ??
            result?.Score ??
            0
        );


    const percentage =
        Number(
            result?.precentage ??
            result?.percentage ??
            result?.Percentage ??
            0
        );


    const totalCount =
        state.questionBank?.questions?.length ||
        0;


    animateScoreCountUp(
        score,
        totalCount
    );


    if (els.resultPercentageText) {

        els.resultPercentageText.textContent =
            percentage + "%";
    }
}


/* =========================================================
   SCORE ANIMATION
========================================================= */

function animateScoreCountUp(
    score,
    totalCount
) {

    if (!els.resultScoreText) {
        return;
    }


    const durationMs =
        700;


    const startTime =
        performance.now();


    function tick(now) {

        const progress =
            Math.min(
                1,
                (
                    now -
                    startTime
                ) /
                durationMs
            );


        const displayedScore =
            Math.round(
                progress *
                score
            );


        els.resultScoreText.textContent =
            displayedScore +
            " / " +
            totalCount;


        if (progress < 1) {

            window.requestAnimationFrame(
                tick
            );

        }
        else {

            els.resultScoreText.textContent =
                score +
                " / " +
                totalCount;
        }
    }


    window.requestAnimationFrame(
        tick
    );
}


/* =========================================================
   VIOLATION SYSTEM
   Same idea as exam.js: track leaving the tab/window while
   solving, and auto-submit after MAX_VIOLATIONS.
   Selecting an answer never counts as a violation.
========================================================= */

function registerViolation(message) {

    if (
        !state.examStarted ||
        state.examSubmitted
    ) {
        return;
    }

    state.violationCount++;

    console.warn(
        "Question Bank Violation:",
        state.violationCount,
        message
    );

    showToast(
        `${message} (${state.violationCount}/${MAX_VIOLATIONS})`
    );

    if (state.violationCount >= MAX_VIOLATIONS) {

        showToast(
            "تم تجاوز الحد المسموح للمخالفات وسيتم إرسال إجاباتك تلقائيًا."
        );

        window.setTimeout(
            function () {

                submitQuestionBank();
            },
            1500
        );
    }
}


document.addEventListener(
    "visibilitychange",
    function () {

        if (
            !document.hidden ||
            !state.examStarted ||
            state.examSubmitted
        ) {
            return;
        }

        if (state.visibilityViolationLock) {
            return;
        }

        state.visibilityViolationLock = true;

        registerViolation(
            "تم رصد مغادرة صفحة بنك الأسئلة."
        );

        window.setTimeout(
            function () {

                state.visibilityViolationLock = false;
            },
            1000
        );
    }
);


window.addEventListener(
    "blur",
    function () {

        if (
            !state.examStarted ||
            state.examSubmitted
        ) {
            return;
        }

        if (document.hidden) {
            return;
        }

        if (state.visibilityViolationLock) {
            return;
        }

        /*
           IMPORTANT — MOBILE FALSE POSITIVES:

           On mobile browsers, "window blur" fires for many
           harmless reasons that are NOT the student leaving
           the page: opening the on-screen keyboard, the
           address bar hiding/showing on scroll, a system
           notification banner, etc. In those cases focus
           returns almost immediately.

           Real tab/app switching is still caught reliably by
           the "visibilitychange" handler above regardless of
           this fix.

           So instead of registering the violation immediately,
           we wait briefly and re-check that the window is
           genuinely still unfocused (and the page still
           visible, i.e. not a real tab switch which
           visibilitychange already handles) before counting it.
           This does not change MAX_VIOLATIONS or remove any
           violation case — it only filters out mobile blur
           noise that isn't a real violation.
        */

        window.setTimeout(
            function () {

                if (
                    !state.examStarted ||
                    state.examSubmitted
                ) {
                    return;
                }

                if (document.hidden) {
                    return;
                }

                if (document.hasFocus()) {
                    return;
                }

                if (state.visibilityViolationLock) {
                    return;
                }

                state.visibilityViolationLock = true;

                registerViolation(
                    "تم رصد مغادرة نافذة بنك الأسئلة."
                );

                window.setTimeout(
                    function () {

                        state.visibilityViolationLock = false;
                    },
                    1000
                );
            },
            450
        );
    }
);


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    function (event) {

        if (
            state.examStarted &&
            !state.examSubmitted
        ) {

            event.preventDefault();

            event.returnValue = "";
        }
    }
);


/* =========================================================
   TOAST
========================================================= */

let questionBankToastTimeoutId =
    null;


function showToast(message) {

    if (
        !els.examToast ||
        !els.examToastMsg
    ) {

        console.warn(
            message
        );

        return;
    }


    els.examToastMsg.textContent =
        message;


    els.examToast.classList.remove(
        "d-none"
    );


    window.requestAnimationFrame(
        function () {

            els.examToast.classList.add(
                "show"
            );
        }
    );


    if (
        questionBankToastTimeoutId
    ) {

        window.clearTimeout(
            questionBankToastTimeoutId
        );
    }


    questionBankToastTimeoutId =
        window.setTimeout(
            hideToast,
            TOAST_DURATION_MS
        );
}


function hideToast() {

    if (!els.examToast) {
        return;
    }


    els.examToast.classList.remove(
        "show"
    );


    window.setTimeout(
        function () {

            els.examToast.classList.add(
                "d-none"
            );

        },
        350
    );
}
