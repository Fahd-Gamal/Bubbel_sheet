/* =====================================================
LESSONS PAGE — JS
Dynamic Lessons Loading

URL:
lessons.html?subjectId=5

API:
GET /Subject/get-lesson?subjectId=5
===================================================== */

/* =========================
INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const refreshed =
            await refreshToken();

        if (!refreshed) {

            window.location.href =
                "login.html";

            return;
        }

        await loadLessons();

    }
);

/* =========================
CONFIG
========================= */

const LESSONS_API = "/Subject/get-lessons";

/* =========================
GET SUBJECT ID
========================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    Number(
        urlParams.get("subjectId")
    );

console.log(
    "Subject ID:",
    subjectId
);

/* =========================
STATUS META
========================= */
const statusMeta = {

    1: {
        label: "لم يبدأ",
        icon: "bi-circle",
        cta: "ابدأ الدرس",
        ctaIcon: "bi-play-fill",
        className: "not-started",
        accent: "linear-gradient(135deg,#8B95A7,#B4BCC8)"
    },

    2: {
        label: "قيد المشاهدة",
        icon: "bi-play-circle-fill",
        cta: "استكمال الدرس",
        ctaIcon: "bi-play-fill",
        className: "in-progress",
        accent: "linear-gradient(135deg,#00A9F2,#48BED9)"
    },

    3: {
        label: "مكتمل",
        icon: "bi-check-circle-fill",
        cta: "مشاهدة الدرس",
        ctaIcon: "bi-arrow-repeat",
        className: "completed",
        accent: "linear-gradient(135deg,#00D2A8,#00E2E0)"
    }

};
/* =========================
LOAD LESSONS
========================= */

async function loadLessons() {

    if (!subjectId) {

        console.error(
            "Invalid Subject Id"
        );

        return;
    }

    try {

        const response =
            await apiRequest(
                `${LESSONS_API}?subjectId=${subjectId}`,
                {
                    method: "GET"
                }
            );

        console.log(
            "Lessons Response:",
            response
        );

        if (!response.ok) {

            console.error(
                await response.text()
            );

            return;
        }

        const data = await response.json();
        data.lessons = sortLessons(data.lessons || []);
        console.log(
            "Lessons Data:",
            data
        );

        fillHero(data);
        renderLessons(data.lessons);
        updateHeroStats(data);
        setupScrollReveal();
    }

    catch (error) {

        console.error(
            "Failed:",
            error
        );

    }

}

/* =========================
FILL HERO
========================= */

function fillHero(data) {

    const subjectName =
        document.getElementById(
            "subjectName"
        );

    const subjectDesc =
        document.getElementById(
            "subjectDesc"
        );

    const subjectStage =
        document.getElementById(
            "subjectStage"
        );

    const breadcrumb =
        document.getElementById(
            "lessonsBreadcrumb"
        );

    if (subjectName)
        subjectName.textContent =
            data.name;

    if (subjectDesc)
        subjectDesc.textContent =
            data.description;

    if (subjectStage)
        subjectStage.textContent = getLevelName(data.level);
    if (breadcrumb)
        breadcrumb.textContent = getLevelName(data.level);
}

/* =========================
RENDER LESSONS
========================= */

function renderLessons(
    lessons
) {

    const grid =
        document.getElementById(
            "lessonsGrid"
        );

    if (!grid)
        return;

    grid.innerHTML =
        lessons.map(function (
            lesson,
            index
        ) {

            const meta =
                statusMeta[
                    lesson.lessonStatue
                ] ||
                statusMeta[1];

            const order =
                String(
                    lesson.index ||
                    index + 1
                ).padStart(
                    2,
                    "0"
                );
            return (

                '<div class="col-lg-4 col-md-6 lsn-card-col" data-r="up" data-d="' +
                (index + 1) +
                '">' +

                '<div class="lsn-card" style="--lsn-accent:' + meta.accent + ';">' +

                '<span class="lsn-card-bar"></span>' +

                '<div class="lsn-card-top">' +

                '<div class="lsn-card-icon">' +
                    (lesson.index || index + 1) +
                '</div>' +

                '<span class="lsn-card-number">' +
                'الدرس # ' +
                order +
                '</span>' +

                '</div>' +

                '<h3>' +
                (lesson.lessonName || "درس") +
                '</h3>' +

                '<p>' +
                (lesson.description || "") +
                '</p>' +

                '<div class="lsn-card-footer">' +

                '<span class="lsn-status ' +
                meta.className +
                '">' +

                '<i class="bi ' +
                meta.icon +
                '"></i>' +

                meta.label +

                '</span>' +

                '<button class="lsn-card-btn" ' +
                'type="button" ' +
                'onclick="openLesson(' +
                lesson.lessonID +
                ')">' +

                meta.cta +

                '<i class="bi ' +
                meta.ctaIcon +
                '"></i>' +

                '</button>' +

                '</div>' +

                '</div>' +

                '</div>'

            );

        }).join("");

}

/* =========================
OPEN LESSON
========================= */

function openLesson(
    lessonId
) {

    if (!lessonId) {

        console.error(
            "Invalid Lesson Id"
        );
        console.log(lesson);
        return;
    }

    window.location.href =`lessonsDetials.html?lessonId=${lessonId}&subjectId=${subjectId}`;

}

/* =========================
HERO STATS
========================= */

function updateHeroStats(
    data
) {

    const lessonsCount =
        document.getElementById(
            "lessonsCount"
        );

    const lessonsDone =
        document.getElementById(
            "lessonsDone"
        );

    const lessonsProgress =
        document.getElementById(
            "lessonsProgress"
        );

    if (lessonsCount) {

        lessonsCount.textContent =
            data.lessonCount || 0;

    }

    if (lessonsDone) {

        lessonsDone.textContent =
            data.completedLessons || 0;

    }

    if (lessonsProgress) {

        lessonsProgress.textContent =
            (data.percentage || 0) +
            "٪";

    }

}
/* =========================
LEVEL FORMAT
========================= */

function getLevelName(level) {

    switch (Number(level)) {

        case 1:
            return "المرحلة الابتدائية";

        case 2:
            return "المرحلة الإعدادية";

        case 3:
            return "المرحلة الثانوية";

        default:
            return level || "";
    }

}

/* =========================
SORT LESSONS
========================= */

function sortLessons(lessons) {

    if (!Array.isArray(lessons))
        return [];

    return [...lessons].sort(function (a, b) {

        return (a.index || 0) - (b.index || 0);

    });

}

/* =========================
SCROLL REVEAL
========================= */

function setupScrollReveal() {

    const items =
        document.querySelectorAll(
            '[data-r="up"]'
        );

    if (!items.length)
        return;

    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        items.forEach(function (el) {

            el.classList.add(
                "lsn-visible"
            );

        });

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

                            entry.target.classList.add(
                                "lsn-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }

                );

            },

            {
                threshold: 0.15
            }

        );

    items.forEach(function (el) {

        observer.observe(el);

    });

}