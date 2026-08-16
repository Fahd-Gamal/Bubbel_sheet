/* =====================================================
TEACHER LESSONS MANAGEMENT — JS
Reuses the exact GET flow/endpoint from the student
Lessons page. Add/Edit/Delete endpoints are NOT invented —
see CONFIG below. Fill them in once you confirm the real
routes/request bodies; every handler is already wired and
will start working the moment a URL is set.

URL:
teacher-lessons.html?subjectId=5
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

// ✅ Confirmed working — same GET endpoint used by the student Lessons page.
const LESSONS_API = "/Subject/get-lessons";

// ⚠️ NOT CONFIRMED — no matching endpoint was in the files you shared.
// Set these once you have the real route + method + request body from the
// backend. Nothing here is invented: until you fill these in, the Add /
// Edit / Delete actions will show a clear message instead of firing a
// request to a guessed URL.
const ADD_LESSON_API = "/Lessons/add-lesson";// e.g. { url: "/Subject/add-lesson", method: "POST" }
const EDIT_LESSON_API = "/Lessons/edit-lesson";     // e.g. { url: "/Subject/edit-lesson", method: "PUT" }
const DELETE_LESSON_API = "/Lessons/delete-lesson";   // e.g. { url: "/Subject/delete-lesson", method: "DELETE" }

// Page the "إدارة الدرس" button navigates to. Defaults to the same
// lessonId/subjectId query-param pattern already used by the student
// page's openLesson(). Point this at the real teacher content-management
// page once you tell me its filename.
const MANAGE_LESSON_PAGE = "lessons_datiels.html";

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
STATE
========================= */

// Cache of the lessons currently on screen, keyed by lessonID, so
// Edit/Delete/Manage don't need a second API round-trip.
let lessonsCache = {};
let pendingDeleteId = null;

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

        setGridLoading(true);

        const response =
            await apiRequest(
                `${LESSONS_API}?subjectId=${subjectId}`,
                {
                    method: "GET"
                }
            );

        if (!response.ok) {

            console.error(
                await response.text()
            );

            showToast("تعذر تحميل الدروس، حاول مرة أخرى", "error");

            setGridLoading(false);

            return;
        }

        const data = await response.json();
        data.lessons = sortLessons(data.lessons || []);

        console.log(
            "Lessons Data:",
            data
        );

        lessonsCache = {};
        data.lessons.forEach(function (lesson) {
            lessonsCache[lesson.lessonID] = lesson;
        });

        fillHero(data);
        renderLessons(data.lessons);
        setupScrollReveal();
    }

    catch (error) {

        console.error(
            "Failed:",
            error
        );

        showToast("حدث خطأ أثناء تحميل الدروس", "error");
    }

    finally {

        setGridLoading(false);

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

    const lessonsCount =
        document.getElementById(
            "lessonsCount"
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

    if (lessonsCount)
        lessonsCount.textContent = (data.lessons || []).length;

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

    if (!lessons.length) {

        grid.innerHTML = renderEmptyState();
        return;

    }

    grid.innerHTML =
        lessons.map(function (
            lesson,
            index
        ) {

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

                '<div class="lsn-card">' +

                '<span class="lsn-card-bar"></span>' +

                '<div class="lsn-card-top">' +

                '<div class="lsn-card-icon">' +
                '<i class="bi bi-journal-text"></i>' +
                '</div>' +

                '<span class="lsn-card-number">' +
                'الترتيب: ' +
                order +
                '</span>' +

                '</div>' +

                '<h3>' +
                escapeHtml(lesson.lessonName || "درس") +
                '</h3>' +

                '<p>' +
                escapeHtml(lesson.description || "") +
                '</p>' +

                '<div class="lsn-card-footer">' +

                '<button class="lsn-card-btn" ' +
                'type="button" ' +
                'onclick="manageLesson(' +
                lesson.lessonID +
                ')">' +

                'إدارة الدرس' +

                '<i class="bi bi-arrow-left"></i>' +

                '</button>' +

                '<div class="lsn-icon-actions">' +

                '<button class="lsn-icon-btn lsn-icon-edit" type="button" ' +
                'title="تعديل الدرس" aria-label="تعديل الدرس" ' +
                'onclick="openEditModal(' + lesson.lessonID + ')">' +
                '<i class="bi bi-pencil-fill"></i>' +
                '</button>' +

                '<button class="lsn-icon-btn lsn-icon-delete" type="button" ' +
                'title="حذف الدرس" aria-label="حذف الدرس" ' +
                'onclick="openDeleteModal(' + lesson.lessonID + ')">' +
                '<i class="bi bi-trash-fill"></i>' +
                '</button>' +

                '</div>' +

                '</div>' +

                '</div>' +

                '</div>'

            );

        }).join("");

}

function renderEmptyState() {

    return (
        '<div class="col-12">' +
        '<div class="lsn-empty" data-r="up">' +
        '<i class="bi bi-journal-plus"></i>' +
        '<h3>لا توجد دروس بعد</h3>' +
        '<p>ابدأ بإضافة أول درس في هذه المادة.</p>' +
        '<button class="lsn-card-btn" type="button" onclick="openAddModal()">' +
        '+ إضافة درس' +
        '</button>' +
        '</div>' +
        '</div>'
    );

}

function setGridLoading(isLoading) {

    const grid =
        document.getElementById(
            "lessonsGrid"
        );

    if (!grid)
        return;

    if (isLoading) {

        grid.innerHTML =
            '<div class="col-12 lsn-loading" data-r="up">' +
            '<div class="spinner-border" role="status"></div>' +
            '<span>جاري تحميل الدروس...</span>' +
            '</div>';

    }

}

/* =========================
MANAGE LESSON (navigate)
========================= */

function manageLesson(
    lessonId
) {

    if (!lessonId) {

        console.error(
            "Invalid Lesson Id"
        );

        return;
    }

    window.location.href =
        `${MANAGE_LESSON_PAGE}?lessonId=${lessonId}&subjectId=${subjectId}`;

}

/* =========================
ADD LESSON
========================= */

function openAddModal() {

    const form =
        document.getElementById("addLessonForm");

    if (form)
        form.reset();

    showModal("addLessonModal");

}

async function submitAddLesson(event) {

    event.preventDefault();

    if (!ADD_LESSON_API) {

        showToast(
            "لم يتم تحديد endpoint لإضافة الدرس بعد — حدّثه في CONFIG أعلى الملف",
            "error"
        );

        return;

    }

    const lessonName =
        document.getElementById("addLessonName").value.trim();

    const description =
        document.getElementById("addLessonDesc").value.trim();

    if (!lessonName) {

        showToast("اسم الدرس مطلوب", "error");
        return;

    }

    const submitBtn =
        document.getElementById("addLessonSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const data = new FormData();
        data.append("Name", lessonName);
        data.append("SubjectId", subjectId);
        data.append("Description", description);


        const response =
            await apiRequest(
                ADD_LESSON_API,
                {
                    method: ADD_LESSON_API.method || "POST",
                    body: data
                }
            );

        if (!response.ok) {

            console.error(await response.text());
            showToast("تعذرت إضافة الدرس", "error");
            return;

        }

        showToast("تمت إضافة الدرس بنجاح", "success");
        hideModal("addLessonModal");
        await loadLessons();

    }

    catch (error) {

        console.error("Failed:", error);
        showToast("حدث خطأ أثناء إضافة الدرس", "error");

    }

    finally {

        setBtnLoading(submitBtn, false);

    }

}

/* =========================
EDIT LESSON
========================= */

function openEditModal(lessonId) {

    const lesson = lessonsCache[lessonId];

    if (!lesson) {

        console.error("Lesson not found in cache:", lessonId);
        return;

    }

    document.getElementById("editLessonId").value = lesson.lessonID;
    document.getElementById("editLessonName").value = lesson.lessonName || "";
    document.getElementById("editLessonDesc").value = lesson.description || "";

    showModal("editLessonModal");

}

async function submitEditLesson(event) {

    event.preventDefault();

    if (!EDIT_LESSON_API) {

        showToast(
            "لم يتم تحديد endpoint لتعديل الدرس بعد — حدّثه في CONFIG أعلى الملف",
            "error"
        );

        return;

    }

    const lessonId =
        Number(document.getElementById("editLessonId").value);

    const lessonName =
        document.getElementById("editLessonName").value.trim();

    const description =
        document.getElementById("editLessonDesc").value.trim();

    if (!lessonName) {

        showToast("اسم الدرس مطلوب", "error");
        return;

    }

    const submitBtn =
        document.getElementById("editLessonSubmitBtn");

    setBtnLoading(submitBtn, true);

    try {
        const data = new FormData();
        data.append("Name", lessonName);
        data.append("Description", description);
        data.append("LessonId", lessonId);
        const response =
            await apiRequest(
                EDIT_LESSON_API,
                {
                    method: EDIT_LESSON_API.method || "PUT",
                    body: data
                }
            );

        if (!response.ok) {

            console.error(await response.text());
            showToast("تعذر حفظ التعديلات", "error");
            return;

        }

        showToast("تم حفظ التعديلات بنجاح", "success");
        hideModal("editLessonModal");
        await loadLessons();

    }

    catch (error) {

        console.error("Failed:", error);
        showToast("حدث خطأ أثناء حفظ التعديلات", "error");

    }

    finally {

        setBtnLoading(submitBtn, false);

    }

}

/* =========================
DELETE LESSON
========================= */

function openDeleteModal(lessonId) {

    pendingDeleteId = lessonId;
    showModal("deleteLessonModal");

}

async function confirmDeleteLesson() {

    if (!DELETE_LESSON_API) {

        showToast(
            "لم يتم تحديد endpoint لحذف الدرس بعد — حدّثه في CONFIG أعلى الملف",
            "error"
        );

        return;

    }

    if (!pendingDeleteId)
        return;

    const confirmBtn =
        document.getElementById("deleteLessonConfirmBtn");

    setBtnLoading(confirmBtn, true);

    try {

        const response =
            await apiRequest(
                `${DELETE_LESSON_API}?Id=${pendingDeleteId}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {

            console.error(await response.text());
            showToast("تعذر حذف الدرس", "error");
            return;

        }

        showToast("تم حذف الدرس بنجاح", "success");
        hideModal("deleteLessonModal");

        delete lessonsCache[pendingDeleteId];
        pendingDeleteId = null;

        await loadLessons();

    }

    catch (error) {

        console.error("Failed:", error);
        showToast("حدث خطأ أثناء حذف الدرس", "error");

    }

    finally {

        setBtnLoading(confirmBtn, false);

    }

}

/* =========================
MODAL HELPERS (Bootstrap 5)
========================= */

function showModal(id) {

    const el = document.getElementById(id);

    if (!el)
        return;

    const modal =
        bootstrap.Modal.getOrCreateInstance(el);

    modal.show();

}

function hideModal(id) {

    const el = document.getElementById(id);

    if (!el)
        return;

    const modal =
        bootstrap.Modal.getInstance(el);

    if (modal)
        modal.hide();

}

function setBtnLoading(btn, isLoading) {

    if (!btn)
        return;

    btn.disabled = isLoading;
    btn.classList.toggle("lsn-btn-loading", isLoading);

}

/* =========================
TOAST NOTIFICATIONS
========================= */

function showToast(message, type) {

    const container =
        getToastContainer();

    const toast =
        document.createElement("div");

    toast.className =
        "lsn-toast lsn-toast-" + (type || "success");

    toast.innerHTML =
        '<i class="bi ' +
        (type === "error" ? "bi-x-circle-fill" : "bi-check-circle-fill") +
        '"></i><span>' +
        escapeHtml(message) +
        '</span>';

    container.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("lsn-toast-show");
    });

    setTimeout(function () {

        toast.classList.remove("lsn-toast-show");

        setTimeout(function () {
            toast.remove();
        }, 300);

    }, 3200);

}

function getToastContainer() {

    let container =
        document.getElementById("lsnToastContainer");

    if (!container) {

        container = document.createElement("div");
        container.id = "lsnToastContainer";
        container.className = "lsn-toast-container";
        document.body.appendChild(container);

    }

    return container;

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
UTIL
========================= */

function escapeHtml(str) {

    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;

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