/* =========================================================
   BUBBLE SHEET — REVIEW EXAM
   Review submitted exam answers only.
   No timer / no submit / no exam mode.
========================================================= */


/* =========================================================
   API
========================================================= */

const REVIEW_EXAM_API = "/Exam/GetExam";


/* =========================================================
   GLOBAL DATA
========================================================= */

let reviewExamId = 0;
let reviewExamData = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    const refreshed = await refreshToken();

    if (!refreshed) {
        window.location.href = "login.html";
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    reviewExamId =
        Number(
            params.get("examId")
        );


    if (!reviewExamId) {

        console.error(
            "Invalid examId"
        );

        showReviewError(
            "رقم الامتحان غير صحيح."
        );

        return;
    }


    await loadReviewExam();

});


/* =========================================================
   LOAD EXAM
========================================================= */

async function loadReviewExam() {

    try {

        showReviewLoading();


        const response =
            await apiRequest(
                `${REVIEW_EXAM_API}?examId=${encodeURIComponent(reviewExamId)}`,
                {
                    method: "GET"
                }
            );


        console.log(
            "Review Exam Response:",
            response
        );


        if (!response.ok) {

            if (response.status === 401) {

                window.location.href =
                    "login.html";

                return;
            }


            let message =
                "تعذر تحميل مراجعة الامتحان.";


            try {

                const errorData =
                    await response.json();


                if (
                    errorData &&
                    errorData.message
                ) {

                    message =
                        errorData.message;

                }

            }
            catch (error) {
                // Keep default message
            }


            showReviewError(
                message
            );

            return;
        }


        reviewExamData =
            await response.json();


        console.log(
            "Review Exam Data:",
            reviewExamData
        );


        renderReviewExam();


    }
    catch (error) {

        console.error(
            "Review Exam Error:",
            error
        );


        showReviewError(
            "حدث خطأ أثناء تحميل مراجعة الامتحان."
        );

    }

}


/* =========================================================
   RENDER REVIEW
========================================================= */

function renderReviewExam() {

    hideReviewLoading();


    const exam =
        reviewExamData;


    /*
        دعم أكثر من شكل للـ JSON
    */

    const examName =
        exam?.examName ??
        exam?.name ??
        exam?.ExamName ??
        "مراجعة الامتحان";


    const subjectName =
        exam?.subjectName ??
        exam?.SubjectName ??
        "—";


    const academicYearName =
        exam?.academicYearName ??
        exam?.AcademicYearName ??
        exam?.gradeName ??
        "—";


    const questions =
        getQuestionsFromExam(
            exam
        );


    setText(
        "reviewExamName",
        examName
    );


    setText(
        "reviewSubject",
        subjectName
    );


    setText(
        "reviewAcademicYear",
        academicYearName
    );


    setText(
        "reviewQuestionCount",
        `${questions.length} سؤال`
    );


    /*
        Render result summary
    */

    renderReviewSummary(
        questions
    );


    /*
        Render questions
    */

    renderReviewQuestions(
        questions
    );

}


/* =========================================================
   GET QUESTIONS
========================================================= */

function getQuestionsFromExam(exam) {

    if (!exam)
        return [];


    /*
        Possible API structures
    */

    if (
        Array.isArray(
            exam.questions
        )
    ) {

        return exam.questions;

    }


    if (
        Array.isArray(
            exam.Questions
        )
    ) {

        return exam.Questions;

    }


    if (
        Array.isArray(
            exam.mcq
        )
    ) {

        return [
            ...exam.mcq
        ];

    }


    if (
        Array.isArray(
            exam.true_false
        )
    ) {

        return [
            ...exam.true_false
        ];

    }


    return [];

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderReviewQuestions(
    questions
) {

    const container =
        document.getElementById(
            "reviewQuestionsContainer"
        );


    if (!container)
        return;


    if (!questions.length) {

        container.innerHTML = `
            <div class="gc exam-result-card">
                <div class="result-icon-wrap">
                    <i class="bi bi-info-circle-fill"></i>
                </div>

                <h2>لا توجد أسئلة للمراجعة</h2>

                <p class="ay-subtitle">
                    لم يتم العثور على أسئلة لهذا الامتحان.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        questions
            .map(
                function (question, index) {

                    return reviewQuestionHTML(
                        question,
                        index
                    );

                }
            )
            .join("");

}


/* =========================================================
   QUESTION HTML
========================================================= */

function reviewQuestionHTML(
    question,
    index
) {

    const questionText =
        question?.questionText ??
        question?.text ??
        question?.question ??
        question?.QuestionText ??
        "";


    const questionImage =
        question?.imageUrl ??
        question?.image ??
        question?.questionImage ??
        question?.QuestionImage ??
        null;


    const questionType =
        question?.type ??
        question?.questionType ??
        question?.QuestionType ??
        "mcq";


    /*
        Student answer
    */

    const studentAnswer =
        getStudentAnswer(
            question
        );


    /*
        Correct answer
    */

    const correctAnswer =
        getCorrectAnswer(
            question
        );


    /*
        Compare answers
    */

    const isAnswered =
        studentAnswer !== null &&
        studentAnswer !== undefined &&
        String(studentAnswer).trim() !== "";


    const isCorrect =
        isAnswered &&
        answersAreEqual(
            studentAnswer,
            correctAnswer
        );


    /*
        Question state
    */

    let questionStateClass =
        "review-question-unanswered";


    if (isCorrect) {

        questionStateClass =
            "review-question-correct";

    }
    else if (isAnswered) {

        questionStateClass =
            "review-question-wrong";

    }


    /*
        Question number
    */

    const number =
        index + 1;


    /*
        Options
    */

    const options =
        getQuestionOptions(
            question
        );


    return `
        <div
            class="exam-question-card review-question-card ${questionStateClass}"
            data-question-index="${index}">

            <div class="exam-question-header">

                <div class="exam-question-number">
                    ${number}
                </div>

                <div class="exam-question-title-wrap">

                    <span class="exam-question-label">
                        السؤال ${number}
                    </span>

                    ${
                        isCorrect
                            ? `
                                <span class="review-answer-badge review-answer-correct">
                                    <i class="bi bi-check-circle-fill"></i>
                                    إجابة صحيحة
                                </span>
                              `
                            : isAnswered
                                ? `
                                    <span class="review-answer-badge review-answer-wrong">
                                        <i class="bi bi-x-circle-fill"></i>
                                        إجابة خاطئة
                                    </span>
                                  `
                                : `
                                    <span class="review-answer-badge review-answer-unanswered">
                                        <i class="bi bi-dash-circle-fill"></i>
                                        لم تتم الإجابة
                                    </span>
                                  `
                    }

                </div>

            </div>


            <div class="exam-question-body">

                <div class="exam-question-text">

                    ${escapeHtml(questionText)}

                </div>


                ${
                    questionImage
                        ? `
                            <div class="exam-question-image">

                                <img
                                    src="${escapeAttr(questionImage)}"
                                    alt="صورة السؤال"
                                    loading="lazy">

                            </div>
                          `
                        : ""
                }


                ${
                    renderReviewOptions(
                        options,
                        studentAnswer,
                        correctAnswer,
                        questionType
                    )
                }


                ${renderAnswerExplanation(
                    studentAnswer,
                    correctAnswer,
                    isAnswered,
                    isCorrect
                )}

            </div>

        </div>
    `;

}


/* =========================================================
   OPTIONS
========================================================= */

function getQuestionOptions(
    question
) {

    const options =
        question?.options ??
        question?.answers ??
        question?.choices ??
        question?.Options ??
        null;


    if (Array.isArray(options)) {

        return options;

    }


    /*
        MCQ API may return:
        optionA / optionB / optionC / optionD
    */

    const generated = [];


    const possibleOptions = [
        [
            question?.optionA ??
            question?.OptionA ??
            question?.answerA ??
            question?.AnswerA,
            "أ"
        ],
        [
            question?.optionB ??
            question?.OptionB ??
            question?.answerB ??
            question?.AnswerB,
            "ب"
        ],
        [
            question?.optionC ??
            question?.OptionC ??
            question?.answerC ??
            question?.AnswerC,
            "ج"
        ],
        [
            question?.optionD ??
            question?.OptionD ??
            question?.answerD ??
            question?.AnswerD,
            "د"
        ]
    ];


    possibleOptions.forEach(
        function (item) {

            if (
                item[0] !== undefined &&
                item[0] !== null &&
                String(item[0]).trim() !== ""
            ) {

                generated.push({
                    text: item[0],
                    label: item[1]
                });

            }

        }
    );


    return generated;

}


/* =========================================================
   RENDER OPTIONS
========================================================= */

function renderReviewOptions(
    options,
    studentAnswer,
    correctAnswer,
    questionType
) {

    /*
        True / False
    */

    if (
        !options.length &&
        isTrueFalseQuestion(
            questionType
        )
    ) {

        options = [
            {
                text: "صح",
                value: true,
                label: "صح"
            },
            {
                text: "خطأ",
                value: false,
                label: "خطأ"
            }
        ];

    }


    if (!options.length) {

        /*
            لو الـ API بيرجع الإجابة
            مباشرة بدون options.
        */

        return `
            <div class="review-direct-answer">

                ${renderDirectAnswer(
                    studentAnswer,
                    correctAnswer
                )}

            </div>
        `;

    }


    return `
        <div class="exam-options">

            ${options
                .map(
                    function (option, index) {

                        return reviewOptionHTML(
                            option,
                            index,
                            studentAnswer,
                            correctAnswer
                        );

                    }
                )
                .join("")}

        </div>
    `;

}


/* =========================================================
   OPTION HTML
========================================================= */

function reviewOptionHTML(
    option,
    index,
    studentAnswer,
    correctAnswer
) {

    const optionValue =
        option?.value ??
        option?.id ??
        option?.answer ??
        option?.text ??
        "";


    const optionText =
        option?.text ??
        option?.label ??
        option?.value ??
        "";


    const label =
        option?.label ??
        getArabicOptionLabel(
            index
        );


    const isStudentAnswer =
        answersAreEqual(
            studentAnswer,
            optionValue
        );


    const isCorrectAnswer =
        answersAreEqual(
            correctAnswer,
            optionValue
        );


    let stateClass =
        "review-option";


    /*
        Correct answer ALWAYS green.
    */

    if (isCorrectAnswer) {

        stateClass +=
            " review-option-correct";

    }


    /*
        Student wrong answer = RED.
    */

    if (
        isStudentAnswer &&
        !isCorrectAnswer
    ) {

        stateClass +=
            " review-option-wrong";

    }


    /*
        Student correct answer
        already gets correct class.
    */


    return `
        <div
            class="${stateClass}"
            data-option-index="${index}">

            <span class="review-option-letter">
                ${escapeHtml(label)}
            </span>

            <span class="review-option-text">
                ${escapeHtml(optionText)}
            </span>


            ${
                isCorrectAnswer
                    ? `
                        <span class="review-option-status correct">
                            <i class="bi bi-check-circle-fill"></i>
                            الإجابة الصحيحة
                        </span>
                      `
                    : ""
            }


            ${
                isStudentAnswer &&
                !isCorrectAnswer
                    ? `
                        <span class="review-option-status wrong">
                            <i class="bi bi-x-circle-fill"></i>
                            إجابتك
                        </span>
                      `
                    : ""
            }

        </div>
    `;

}


/* =========================================================
   ANSWER EXPLANATION
========================================================= */

function renderAnswerExplanation(
    studentAnswer,
    correctAnswer,
    isAnswered,
    isCorrect
) {

    if (isCorrect) {

        return `
            <div class="review-answer-box review-answer-box-correct">

                <i class="bi bi-check-circle-fill"></i>

                <div>
                    <strong>إجابتك صحيحة</strong>
                    <span>أحسنت، إجابتك تطابق الإجابة الصحيحة.</span>
                </div>

            </div>
        `;

    }


    if (isAnswered) {

        return `
            <div class="review-answer-box review-answer-box-wrong">

                <i class="bi bi-x-circle-fill"></i>

                <div>
                    <strong>إجابتك غير صحيحة</strong>

                    <span>
                        تم تمييز إجابتك باللون الأحمر،
                        والإجابة الصحيحة باللون الأخضر.
                    </span>
                </div>

            </div>
        `;

    }


    return `
        <div class="review-answer-box review-answer-box-unanswered">

            <i class="bi bi-dash-circle-fill"></i>

            <div>

                <strong>لم تتم الإجابة</strong>

                <span>
                    الإجابة الصحيحة موضحة باللون الأخضر.
                </span>

            </div>

        </div>
    `;

}


/* =========================================================
   DIRECT ANSWER
========================================================= */

function renderDirectAnswer(
    studentAnswer,
    correctAnswer
) {

    const isCorrect =
        answersAreEqual(
            studentAnswer,
            correctAnswer
        );


    return `
        <div class="review-direct-answer-grid">

            <div
                class="review-direct-answer-item ${
                    isCorrect
                        ? "review-option-correct"
                        : "review-option-wrong"
                }">

                <span>
                    إجابتك
                </span>

                <strong>
                    ${
                        studentAnswer !== null &&
                        studentAnswer !== undefined &&
                        String(studentAnswer).trim() !== ""
                            ? escapeHtml(
                                normalizeAnswerDisplay(
                                    studentAnswer
                                )
                            )
                            : "لم تتم الإجابة"
                    }
                </strong>

            </div>


            <div class="review-direct-answer-item review-option-correct">

                <span>
                    الإجابة الصحيحة
                </span>

                <strong>
                    ${escapeHtml(
                        normalizeAnswerDisplay(
                            correctAnswer
                        )
                    )}
                </strong>

            </div>

        </div>
    `;

}


/* =========================================================
   GET STUDENT ANSWER
========================================================= */

function getStudentAnswer(
    question
) {

    return (
        question?.studentAnswer ??
        question?.StudentAnswer ??
        question?.userAnswer ??
        question?.UserAnswer ??
        question?.selectedAnswer ??
        question?.SelectedAnswer ??
        question?.answer ??
        question?.Answer ??
        question?.selectedOption ??
        question?.SelectedOption ??
        null
    );

}


/* =========================================================
   GET CORRECT ANSWER
========================================================= */

function getCorrectAnswer(
    question
) {

    return (
        question?.correctAnswer ??
        question?.CorrectAnswer ??
        question?.rightAnswer ??
        question?.RightAnswer ??
        question?.correctOption ??
        question?.CorrectOption ??
        question?.correctAnswerText ??
        question?.CorrectAnswerText ??
        null
    );

}


/* =========================================================
   ANSWER COMPARISON
========================================================= */

function answersAreEqual(
    a,
    b
) {

    if (
        a === null ||
        a === undefined ||
        b === null ||
        b === undefined
    ) {

        return false;

    }


    const normalize =
        function (value) {

            return String(value)
                .trim()
                .toLowerCase();

        };


    const first =
        normalize(a);


    const second =
        normalize(b);


    /*
        Arabic answer normalization
    */

    const normalizeArabic =
        function (value) {

            return value
                .replace(
                    /أ|إ|آ/g,
                    "ا"
                )
                .replace(
                    /ى/g,
                    "ي"
                )
                .replace(
                    /ة/g,
                    "ه"
                )
                .trim();

        };


    if (
        normalizeArabic(first) ===
        normalizeArabic(second)
    ) {

        return true;

    }


    /*
        Boolean values
    */

    if (
        (
            first === "true" &&
            (
                second === "صح" ||
                second === "true" ||
                second === "1"
            )
        )
        ||
        (
            second === "true" &&
            (
                first === "صح" ||
                first === "true" ||
                first === "1"
            )
        )
    ) {

        return true;

    }


    if (
        (
            first === "false" &&
            (
                second === "خطأ" ||
                second === "false" ||
                second === "0"
            )
        )
        ||
        (
            second === "false" &&
            (
                first === "خطأ" ||
                first === "false" ||
                first === "0"
            )
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   TRUE / FALSE DETECTION
========================================================= */

function isTrueFalseQuestion(
    type
) {

    const value =
        String(
            type ?? ""
        )
            .trim()
            .toLowerCase();


    return (
        value === "truefalse" ||
        value === "true_false" ||
        value === "true/false" ||
        value === "tf" ||
        value === "صح وخطأ" ||
        value === "صح/خطأ"
    );

}


/* =========================================================
   ARABIC OPTION LABEL
========================================================= */

function getArabicOptionLabel(
    index
) {

    const labels = [
        "أ",
        "ب",
        "ج",
        "د"
    ];


    return (
        labels[index] ??
        String(index + 1)
    );

}


/* =========================================================
   NORMALIZE ANSWER DISPLAY
========================================================= */

function normalizeAnswerDisplay(
    answer
) {

    if (
        answer === null ||
        answer === undefined
    ) {

        return "—";

    }


    if (answer === true)
        return "صح";


    if (answer === false)
        return "خطأ";


    const value =
        String(answer)
            .trim()
            .toLowerCase();


    if (
        value === "true" ||
        value === "1"
    ) {

        return "صح";

    }


    if (
        value === "false" ||
        value === "0"
    ) {

        return "خطأ";

    }


    return String(answer);

}


/* =========================================================
   REVIEW SUMMARY
========================================================= */

function renderReviewSummary(
    questions
) {

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;


    questions.forEach(
        function (question) {

            const studentAnswer =
                getStudentAnswer(
                    question
                );


            const correctAnswer =
                getCorrectAnswer(
                    question
                );


            const answered =
                studentAnswer !== null &&
                studentAnswer !== undefined &&
                String(studentAnswer).trim() !== "";


            if (!answered) {

                unanswered++;

            }
            else if (
                answersAreEqual(
                    studentAnswer,
                    correctAnswer
                )
            ) {

                correct++;

            }
            else {

                wrong++;

            }

        }
    );


    const total =
        questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (correct / total) * 100
            )
            : 0;


    setText(
        "reviewCorrectCount",
        correct
    );


    setText(
        "reviewWrongCount",
        wrong
    );


    setText(
        "reviewUnansweredCount",
        unanswered
    );


    setText(
        "reviewTotalCount",
        total
    );


    setText(
        "reviewPercentage",
        `${percentage}%`
    );

}


/* =========================================================
   LOADING
========================================================= */

function showReviewLoading() {

    const container =
        document.getElementById(
            "reviewQuestionsContainer"
        );


    if (!container)
        return;


    container.innerHTML = `
        <div class="gc exam-result-card review-loading">

            <div class="spinner-border" role="status">
                <span class="visually-hidden">
                    جاري التحميل...
                </span>
            </div>

            <h2>
                جاري تحميل المراجعة...
            </h2>

            <p class="ay-subtitle">
                لحظات ويتم عرض إجاباتك.
            </p>

        </div>
    `;

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideReviewLoading() {

    /*
        Nothing required here.
        renderReviewQuestions replaces
        the loading content.
    */

}


/* =========================================================
   ERROR
========================================================= */

function showReviewError(
    message
) {

    const container =
        document.getElementById(
            "reviewQuestionsContainer"
        );


    if (!container)
        return;


    container.innerHTML = `
        <div class="gc exam-result-card">

            <div class="result-icon-wrap">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>

            <h2>
                تعذر تحميل المراجعة
            </h2>

            <p class="ay-subtitle">
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="exam-primary-btn"
                onclick="window.history.back()">

                <i class="bi bi-arrow-right"></i>
                العودة

            </button>

        </div>
    `;

}


/* =========================================================
   HELPERS
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
            value ?? "";

    }

}


function escapeHtml(
    value
) {

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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}