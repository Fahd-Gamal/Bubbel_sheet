"use strict";

/* =========================================================
SUBJECTS PAGE
URL:
subjects.html?yearId=5

GET:
/api/Dashboard/get-subjects?YearId=5

Expected Subject:
{
"subjectId": 1,
"name": "الرياضيات",
"description": "وصف المادة",
"price": 150,
"lessonCount": 20
}
========================================================= */

/* =========================================================
INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
initSubjectsPage();
});

/* =========================================================
CONFIG
========================================================= */

const SUBJECTS_API_URL = "/Dashboard/get-subjects";

const ADD_SUBJECT_API_URL = "/Subject/add-subject";

const UPDATE_SUBJECT_API_URL = "/Subject/edit-subject";

const DELETE_SUBJECT_API_URL = "/Subject/delete-subject";

const SKELETON_CARD_COUNT = 6;

/* =========================================================
GET YEAR ID FROM URL
========================================================= */

const urlParams = new URLSearchParams(window.location.search);

const yearId = Number(urlParams.get("yearId"));

console.log("Selected Year ID:", yearId);

/* =========================================================
DOM REFERENCES
========================================================= */

const els = {};

/* =========================================================
CURRENT SUBJECT
========================================================= */

let currentSubject = null;

/*
modalMode:

"add"
"edit"
"delete"
*/

let modalMode = null;

/* =========================================================
CACHE DOM
========================================================= */

function cacheDom() {
/* =========================
PAGE
========================= */

els.skeletonGrid = document.getElementById("skeletonGrid");

els.subjectsGrid = document.getElementById("subjectsGrid");

els.emptyState = document.getElementById("emptyState");

els.errorState = document.getElementById("errorState");

els.emptyRetryBtn = document.getElementById("emptyRetryBtn");

els.errorRetryBtn = document.getElementById("errorRetryBtn");

/* =========================
MODAL
========================= */

els.subjectActionOverlay = document.getElementById("subjectActionOverlay");

els.subjectActionModal = document.getElementById("subjectActionModal");

els.subjectModalClose = document.getElementById("subjectModalClose");

/* =========================
DELETE
========================= */

els.subjectDeleteCard = document.getElementById("subjectDeleteCard");

els.deleteSubjectName = document.getElementById("deleteSubjectName");

els.cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

els.confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

/* =========================
EDIT / ADD
========================= */

els.subjectEditCard = document.getElementById("subjectEditCard");

els.editSubjectForm = document.getElementById("editSubjectForm");

els.editSubjectName = document.getElementById("editSubjectName");

els.editSubjectDescription = document.getElementById(
"editSubjectDescription",
);

els.editSubjectPrice = document.getElementById("editSubjectPrice");

els.cancelEditBtn = document.getElementById("cancelEditBtn");

els.saveEditBtn = document.getElementById("saveEditBtn");
}

/* =========================================================
INIT PAGE
========================================================= */

async function initSubjectsPage() {
cacheDom();

renderSkeletonCards();

bindRetryButtons();

bindModalEvents();

/* =========================
    CHECK YEAR ID
========================= */

if (!yearId || yearId <= 0) {
console.error("Invalid Year ID:", yearId);

showError();

return;
}

/* =========================
    AUTH
========================= */

const refreshed = await refreshToken();

if (!refreshed) {
window.location.href = "login.html";

return;
}

/* =========================
    LOAD SUBJECTS
========================= */

await loadSubjects();
}

/* =========================================================
RETRY BUTTONS
========================================================= */

function bindRetryButtons() {
if (els.emptyRetryBtn) {
els.emptyRetryBtn.addEventListener("click", loadSubjects);
}

if (els.errorRetryBtn) {
els.errorRetryBtn.addEventListener("click", loadSubjects);
}
}

/* =========================================================
MODAL EVENTS
========================================================= */

function bindModalEvents() {
/* =========================
    CLOSE
========================= */

if (els.subjectModalClose) {
els.subjectModalClose.addEventListener("click", closeSubjectModal);
}

/* =========================
    CANCEL DELETE
========================= */

if (els.cancelDeleteBtn) {
els.cancelDeleteBtn.addEventListener("click", closeSubjectModal);
}

/* =========================
    CANCEL EDIT
========================= */

if (els.cancelEditBtn) {
els.cancelEditBtn.addEventListener("click", closeSubjectModal);
}

/* =========================
    CONFIRM DELETE
========================= */

if (els.confirmDeleteBtn) {
els.confirmDeleteBtn.addEventListener("click", confirmDeleteSubject);
}

/* =========================
    EDIT / ADD FORM
========================= */

if (els.editSubjectForm) {
els.editSubjectForm.addEventListener("submit", handleSubjectFormSubmit);
}

/* =========================
    CLICK OUTSIDE
========================= */

if (els.subjectActionOverlay) {
els.subjectActionOverlay.addEventListener("click", function (event) {
    if (event.target === els.subjectActionOverlay) {
    closeSubjectModal();
    }
});
}

/* =========================
    ESC
========================= */

document.addEventListener("keydown", function (event) {
if (
    event.key === "Escape" &&
    els.subjectActionOverlay &&
    !els.subjectActionOverlay.classList.contains("d-none")
) {
    closeSubjectModal();
}
});
}

/* =========================================================
STATE HELPERS
========================================================= */

function showSkeleton() {
toggleVisibility(els.skeletonGrid, true);

toggleVisibility(els.subjectsGrid, false);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, false);
}

function showSubjects() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.subjectsGrid, true);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, false);
}

function showEmpty() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.subjectsGrid, false);

toggleVisibility(els.emptyState, true);

toggleVisibility(els.errorState, false);
}

function showError() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.subjectsGrid, false);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, true);
}

function toggleVisibility(element, isVisible) {
if (!element) {
return;
}

element.classList.toggle("d-none", !isVisible);
}

/* =========================================================
LOAD SUBJECTS
========================================================= */

async function loadSubjects() {
showSkeleton();

try {
const url = `${SUBJECTS_API_URL}?YearId=${encodeURIComponent(yearId)}`;

console.log("Loading Subjects:", url);

let response = await apiRequest(url, {
    method: "GET",
});

console.log("Subjects API Response:", response);

/* =========================
        TOKEN EXPIRED
    ========================= */

if (response.status === 401) {
    console.log("Access token expired. Refreshing...");

    const refreshed = await refreshToken();

    if (!refreshed) {
    window.location.href = "login.html";

    return;
    }

    response = await apiRequest(url, {
    method: "GET",
    });
}

/* =========================
        FINAL AUTH CHECK
    ========================= */

if (response.status === 401) {
    window.location.href = "login.html";

    return;
}

/* =========================
        ERROR
    ========================= */

if (!response.ok) {
    console.error("Subjects API Error:", response.status);

    showError();

    return;
}

/* =========================
        JSON
    ========================= */

const data = await response.json();

console.log("Subjects Data:", data);

const subjects = normalizeSubjectsResponse(data);

if (!Array.isArray(subjects) || subjects.length === 0) {
    showEmpty();

    return;
}

renderSubjectCards(subjects);

showSubjects();
} catch (error) {
console.error("Failed to load subjects:", error);

showError();
}
}

/* =========================================================
NORMALIZE RESPONSE
========================================================= */

function normalizeSubjectsResponse(data) {
if (Array.isArray(data)) {
return data;
}

if (Array.isArray(data?.data)) {
return data.data;
}

if (Array.isArray(data?.result)) {
return data.result;
}

if (Array.isArray(data?.subjects)) {
return data.subjects;
}

if (Array.isArray(data?.Subjects)) {
return data.Subjects;
}

return [];
}

/* =========================================================
SKELETON CARDS
========================================================= */

function renderSkeletonCards() {
if (!els.skeletonGrid) {
return;
}

const fragment = document.createDocumentFragment();

for (let i = 0; i < SKELETON_CARD_COUNT; i++) {
fragment.appendChild(buildSkeletonCard());
}

els.skeletonGrid.innerHTML = "";

els.skeletonGrid.appendChild(fragment);
}

/* =========================================================
BUILD SKELETON
========================================================= */

function buildSkeletonCard() {
const col = document.createElement("div");

col.className = "col-xl-4 col-lg-6 col-md-6 col-12";

const card = document.createElement("div");

card.className = "gc skeleton-card";

card.setAttribute("aria-hidden", "true");

const top = document.createElement("div");

top.className = "skeleton-subject-top";

const icon = document.createElement("div");

icon.className = "skeleton-shape skeleton-subject-icon";

const line1 = document.createElement("div");

line1.className = "skeleton-shape skeleton-line skeleton-line-title";

const line2 = document.createElement("div");

line2.className = "skeleton-shape skeleton-line skeleton-line-description";

const line3 = document.createElement("div");

line3.className = "skeleton-shape skeleton-line skeleton-line-description";

const actions = document.createElement("div");

actions.className = "skeleton-actions";

const button1 = document.createElement("div");

button1.className = "skeleton-shape skeleton-action-btn";

const button2 = document.createElement("div");

button2.className = "skeleton-shape skeleton-action-btn";

top.appendChild(icon);

top.appendChild(line1);

card.appendChild(top);

card.appendChild(line2);

card.appendChild(line3);

actions.appendChild(button1);

actions.appendChild(button2);

card.appendChild(actions);

col.appendChild(card);

return col;
}

/* =========================================================
RENDER SUBJECT CARDS
========================================================= */

function renderSubjectCards(subjects) {
if (!els.subjectsGrid) {
return;
}

const fragment = document.createDocumentFragment();

subjects.forEach(function (subject) {
fragment.appendChild(buildSubjectCard(subject));
});

els.subjectsGrid.innerHTML = "";

els.subjectsGrid.appendChild(fragment);
}

/* =========================================================
BUILD SUBJECT CARD
========================================================= */

function buildSubjectCard(subject) {
const col = document.createElement("div");

col.className = "col-xl-4 col-lg-6 col-md-6 col-12";

col.setAttribute("role", "listitem");

/* =========================
    CARD
========================= */

const card = document.createElement("article");

card.className = "gc subject-card";

/* =========================
    TOP BAR
========================= */

const bar = document.createElement("div");

bar.className = "gc-bar";

/* =========================
    HEADER
========================= */

const header = document.createElement("div");

header.className = "subject-card-header";

const icon = document.createElement("div");

icon.className = "subject-icon";

icon.innerHTML = `<i class="bi bi-journal-bookmark-fill"></i>`;

const titleWrapper = document.createElement("div");

titleWrapper.className = "subject-title-wrapper";

const name = document.createElement("h3");

name.className = "subject-name";

name.textContent = getSubjectName(subject);

const badge = document.createElement("span");

badge.className = "subject-status-badge";

badge.innerHTML = `<i class="bi bi-check-circle-fill"></i> نشطة`;

titleWrapper.appendChild(name);

titleWrapper.appendChild(badge);

header.appendChild(icon);

header.appendChild(titleWrapper);

/* =========================
    DESCRIPTION
========================= */

const description = document.createElement("p");

description.className = "subject-description";

const descriptionValue = getSubjectDescription(subject);

description.textContent = descriptionValue || "لا يوجد وصف للمادة حاليًا.";

/* =========================
    INFO
========================= */

const info = document.createElement("div");

info.className = "subject-info-grid";

/* LESSON COUNT */

const lessons = createInfoItem(
"bi-journal-text",
"عدد الدروس",
`${getLessonCount(subject).toLocaleString("ar-EG")} درس`,
);

/* PRICE */

const price = createInfoItem(
"bi-cash-stack",
"سعر المادة",
`${formatPrice(getSubjectPrice(subject))} ج.م`,
);

info.appendChild(lessons);

info.appendChild(price);

/* =========================
    ACTIONS
========================= */

const actions = document.createElement("div");

actions.className = "subject-actions";

/* =========================
    VIEW
========================= */

const viewButton = document.createElement("button");

viewButton.type = "button";

viewButton.className = "subject-action-btn view";

viewButton.innerHTML = `
    <i class="bi bi-eye"></i>
    عرض المادة
    `;

viewButton.setAttribute("aria-label", `عرض ${getSubjectName(subject)}`);

viewButton.addEventListener("click", function () {
const subjectId = getSubjectId(subject);

if (!subjectId) {
    return;
}

window.location.href = `lessons.html?subjectId=${encodeURIComponent(subjectId)}&yearId=${encodeURIComponent(yearId)}`;
});

actions.appendChild(viewButton);

/* =========================
    EDIT
========================= */

const editButton = document.createElement("button");

editButton.type = "button";

editButton.className = "subject-action-btn edit";

editButton.innerHTML = `
    <i class="bi bi-pencil-square"></i>
    تعديل
    `;

editButton.setAttribute("aria-label", `تعديل ${getSubjectName(subject)}`);

editButton.addEventListener("click", function () {
openEditModal(subject);
});

/* =========================
    DELETE
========================= */

const deleteButton = document.createElement("button");

deleteButton.type = "button";

deleteButton.className = "subject-action-btn delete";

deleteButton.innerHTML = `
    <i class="bi bi-trash3"></i>
    حذف
    `;

deleteButton.setAttribute("aria-label", `حذف ${getSubjectName(subject)}`);

deleteButton.addEventListener("click", function () {
openDeleteModal(subject);
});

actions.appendChild(editButton);

actions.appendChild(deleteButton);

/* =========================
    APPEND
========================= */

card.appendChild(bar);

card.appendChild(header);

card.appendChild(description);

card.appendChild(info);

card.appendChild(actions);

col.appendChild(card);

return col;
}

/* =========================================================
INFO ITEM
========================================================= */

function createInfoItem(iconClass, label, value) {
const item = document.createElement("div");

item.className = "subject-info-item";

const icon = document.createElement("div");

icon.className = "subject-info-icon";

icon.innerHTML = `<i class="bi ${iconClass}"></i>`;

const content = document.createElement("div");

content.className = "subject-info-content";

const labelElement = document.createElement("span");

labelElement.className = "subject-info-label";

labelElement.textContent = label;

const valueElement = document.createElement("strong");

valueElement.className = "subject-info-value";

valueElement.textContent = value;

content.appendChild(labelElement);

content.appendChild(valueElement);

item.appendChild(icon);

item.appendChild(content);

return item;
}

/* =========================================================
SUBJECT DATA HELPERS
========================================================= */

function getSubjectName(subject) {
return (
subject?.name ??
subject?.Name ??
subject?.subjectName ??
subject?.SubjectName ??
"مادة دراسية"
);
}

function getSubjectDescription(subject) {
return (
subject?.description ??
subject?.Description ??
subject?.subjectDescription ??
subject?.SubjectDescription ??
""
);
}

function getSubjectPrice(subject) {
const value =
subject?.price ??
subject?.Price ??
subject?.subjectPrice ??
subject?.SubjectPrice ??
0;

const number = Number(value);

return Number.isFinite(number) ? number : 0;
}

function getLessonCount(subject) {
const value =
subject?.lessonCount ??
subject?.LessonCount ??
subject?.lessonsCount ??
subject?.LessonsCount ??
0;

const number = Number(value);

return Number.isFinite(number) ? number : 0;
}

function getSubjectId(subject) {
return (
subject?.subjectId ??
subject?.SubjectId ??
subject?.id ??
subject?.Id ??
null
);
}

/* =========================================================
FORMAT PRICE
========================================================= */

function formatPrice(price) {
const number = Number(price);

if (!Number.isFinite(number)) {
return "0";
}

return number.toLocaleString("ar-EG", {
minimumFractionDigits: number % 1 !== 0 ? 2 : 0,

maximumFractionDigits: 2,
});
}

/* =========================================================
OPEN ADD MODAL
========================================================= */

function openAddModal() {
modalMode = "add";

currentSubject = null;

showEditCard();

if (els.editSubjectForm) {
els.editSubjectForm.reset();
}

setEditModalMode("add");

openSubjectModal();
}

/* =========================================================
OPEN EDIT MODAL
========================================================= */

function openEditModal(subject) {
if (!subject) {
return;
}

modalMode = "edit";

currentSubject = subject;

showEditCard();

/* NAME */

if (els.editSubjectName) {
els.editSubjectName.value = getSubjectName(subject);
}

/* DESCRIPTION */

if (els.editSubjectDescription) {
els.editSubjectDescription.value = getSubjectDescription(subject);
}

/* PRICE */

if (els.editSubjectPrice) {
els.editSubjectPrice.value = getSubjectPrice(subject);
}

setEditModalMode("edit");

openSubjectModal();
}

/* =========================================================
SET EDIT MODAL MODE
========================================================= */

function setEditModalMode(mode) {
if (!els.subjectEditCard) {
return;
}

const title = els.subjectEditCard.querySelector("h3");

const subtitle = els.subjectEditCard.querySelector(".subject-modal-subtitle");

const icon = els.subjectEditCard.querySelector(".subject-action-icon");

if (mode === "add") {
if (title) {
    title.textContent = "إضافة مادة جديدة";
}

if (subtitle) {
    subtitle.textContent =
    "أدخل بيانات المادة الجديدة ثم اضغط على حفظ المادة.";
}

if (icon) {
    icon.className = "subject-action-icon edit-icon";

    icon.innerHTML = `<i class="bi bi-plus-circle-fill"></i>`;
}

if (els.saveEditBtn) {
    els.saveEditBtn.innerHTML = `
            <i class="bi bi-plus-circle"></i>
            إضافة المادة
            `;
}
} else {
if (title) {
    title.textContent = "تعديل المادة";
}

if (subtitle) {
    subtitle.textContent =
    "قم بتعديل بيانات المادة ثم اضغط على حفظ التعديلات.";
}

if (icon) {
    icon.className = "subject-action-icon edit-icon";

    icon.innerHTML = `<i class="bi bi-pencil-square"></i>`;
}

if (els.saveEditBtn) {
    els.saveEditBtn.innerHTML = `
            <i class="bi bi-check2-circle"></i>
            حفظ التعديلات
            `;
}
}
}

/* =========================================================
OPEN DELETE MODAL
========================================================= */

function openDeleteModal(subject) {
if (!subject) {
return;
}

modalMode = "delete";

currentSubject = subject;

if (els.deleteSubjectName) {
els.deleteSubjectName.textContent = getSubjectName(subject);
}

if (els.subjectDeleteCard) {
els.subjectDeleteCard.classList.remove("d-none");
}

if (els.subjectEditCard) {
els.subjectEditCard.classList.add("d-none");
}

clearDeleteMessage();

openSubjectModal();
}

/* =========================================================
SHOW EDIT CARD
========================================================= */

function showEditCard() {
if (els.subjectDeleteCard) {
els.subjectDeleteCard.classList.add("d-none");
}

if (els.subjectEditCard) {
els.subjectEditCard.classList.remove("d-none");
}
}

/* =========================================================
OPEN MODAL
========================================================= */

function openSubjectModal() {
if (!els.subjectActionOverlay) {
return;
}

els.subjectActionOverlay.classList.remove("d-none");

document.body.classList.add("subject-modal-open");

requestAnimationFrame(function () {
els.subjectActionOverlay.classList.add("show");
});
}

/* =========================================================
CLOSE MODAL
========================================================= */

function closeSubjectModal() {
if (!els.subjectActionOverlay) {
return;
}

els.subjectActionOverlay.classList.remove("show");

setTimeout(function () {
els.subjectActionOverlay.classList.add("d-none");
}, 250);

document.body.classList.remove("subject-modal-open");

currentSubject = null;

modalMode = null;

clearDeleteMessage();
}

/* =========================================================
HANDLE ADD / EDIT FORM
========================================================= */

async function handleSubjectFormSubmit(event) {
event.preventDefault();

const name = els.editSubjectName?.value.trim();

const description = els.editSubjectDescription?.value.trim();

const price = Number(els.editSubjectPrice?.value);

/* =========================
    VALIDATION
========================= */

if (!name) {
showFormMessage("من فضلك اكتب اسم المادة.");

els.editSubjectName?.focus();

return;
}

if (!description) {
showFormMessage("من فضلك اكتب وصف المادة.");

els.editSubjectDescription?.focus();

return;
}

if (!Number.isFinite(price) || price < 0) {
showFormMessage("من فضلك أدخل سعرًا صحيحًا.");

els.editSubjectPrice?.focus();

return;
}

if (modalMode === "add") {
await addSubject({
    name,
    description,
    price,
});

return;
}

if (modalMode === "edit") {
await updateSubject({
    name,
    description,
    price,
});
}
}

/* =========================================================
ADD SUBJECT
========================================================= */

async function addSubject(subjectData) {
if (!yearId) {
showFormMessage("السنة الدراسية غير محددة.");

return;
}

setSaveButtonLoading(true, "جاري إضافة المادة...");

try {
const formData = new FormData();

formData.append("YearId", yearId);
formData.append("Name", subjectData.name);
formData.append("Description", subjectData.description);
formData.append("Price", subjectData.price);

console.log("Add Subject FormData:", {
    YearId: yearId,
    Name: subjectData.name,
    Description: subjectData.description,
    Price: subjectData.price,
});

let response = await apiRequest(ADD_SUBJECT_API_URL, {
    method: "POST",

    body: formData,
});

/* =========================
        TOKEN REFRESH
    ========================= */

if (response.status === 401) {
    const refreshed = await refreshToken();

    if (!refreshed) {
    window.location.href = "login.html";

    return;
    }

    response = await apiRequest(ADD_SUBJECT_API_URL, {
    method: "POST",

    body: formData,
    });
}

if (response.status === 401) {
    window.location.href = "login.html";

    return;
}

if (!response.ok) {
    const errorText = await safeReadResponse(response);

    console.error("Add Subject Error:", response.status, errorText);

    showFormMessage(
    getApiErrorMessage(errorText, "حدث خطأ أثناء إضافة المادة."),
    );

    return;
}

console.log("Subject Added Successfully");

closeSubjectModal();

await loadSubjects();

showSuccessMessage("تمت إضافة المادة بنجاح.");
} catch (error) {
console.error("Add Subject Exception:", error);

showFormMessage("حدث خطأ أثناء إضافة المادة.");
} finally {
setSaveButtonLoading(false);
}
}

/* =========================================================
UPDATE SUBJECT
========================================================= */

async function updateSubject(subjectData) {
    if (!currentSubject) {
        return;
    }

    const subjectId = getSubjectId(currentSubject);

    if (!subjectId) {
        showFormMessage("معرّف المادة غير موجود.");
        return;
    }

    setSaveButtonLoading(true, "جاري حفظ التعديلات...");

    try {

        const formData = new FormData();

        formData.append("SubjectId", subjectId);
        formData.append("Name", subjectData.name);
        formData.append("Description", subjectData.description);
        formData.append("Price", subjectData.price);

        console.log("Update Subject FormData:", {
            SubjectId: subjectId,
            Name: subjectData.name,
            Description: subjectData.description,
            Price: subjectData.price
        });

        let response = await apiRequest(
            UPDATE_SUBJECT_API_URL,
            {
                method: "PUT",
                body: formData
            }
        );

        /* =========================
           TOKEN REFRESH
        ========================= */

        if (response.status === 401) {

            const refreshed = await refreshToken();

            if (!refreshed) {
                window.location.href = "login.html";
                return;
            }

            response = await apiRequest(
                UPDATE_SUBJECT_API_URL,
                {
                    method: "PUT",
                    body: formData
                }
            );
        }

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {

            const errorText =
                await safeReadResponse(response);

            console.error(
                "Update Subject Error:",
                response.status,
                errorText
            );

            showFormMessage(
                getApiErrorMessage(
                    errorText,
                    "حدث خطأ أثناء تعديل المادة."
                )
            );

            return;
        }

        console.log("Subject Updated Successfully");

        closeSubjectModal();

        await loadSubjects();

        showSuccessMessage("تم تعديل المادة بنجاح.");

    } catch (error) {

        console.error(
            "Update Subject Exception:",
            error
        );

        showFormMessage(
            "حدث خطأ أثناء تعديل المادة."
        );

    } finally {

        setSaveButtonLoading(false);
    }
}

/* =========================================================
DELETE SUBJECT
========================================================= */

async function confirmDeleteSubject() {
if (!currentSubject) {
return;
}

const subjectId = getSubjectId(currentSubject);

if (!subjectId) {
showDeleteMessage("معرّف المادة غير موجود.");

return;
}

setDeleteButtonLoading(true);

try {
const url = `${DELETE_SUBJECT_API_URL}/?Id=${encodeURIComponent(subjectId)}`;

console.log("Delete Subject URL:", url);

let response = await apiRequest(url, {
    method: "DELETE",
});

/* =========================
        TOKEN REFRESH
    ========================= */

if (response.status === 401) {
    const refreshed = await refreshToken();

    if (!refreshed) {
    window.location.href = "login.html";

    return;
    }

    response = await apiRequest(url, {
    method: "DELETE",
    });
}

if (response.status === 401) {
    window.location.href = "login.html";

    return;
}

if (!response.ok) {
    const errorText = await safeReadResponse(response);

    console.error("Delete Subject Error:", response.status, errorText);

    showDeleteMessage(
    getApiErrorMessage(errorText, "حدث خطأ أثناء حذف المادة."),
    );

    return;
}

console.log("Subject Deleted Successfully");

closeSubjectModal();

await loadSubjects();

showSuccessMessage("تم حذف المادة بنجاح.");
} catch (error) {
console.error("Delete Subject Exception:", error);

showDeleteMessage("حدث خطأ أثناء حذف المادة.");
} finally {
setDeleteButtonLoading(false);
}
}

/* =========================================================
BUTTON LOADING — SAVE
========================================================= */

function setSaveButtonLoading(loading, text) {
if (!els.saveEditBtn) {
return;
}

if (loading) {
els.saveEditBtn.disabled = true;

els.saveEditBtn.dataset.originalHtml = els.saveEditBtn.innerHTML;

els.saveEditBtn.innerHTML = `
        <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true">
        </span>

        ${text || "جاري الحفظ..."}
        `;
} else {
els.saveEditBtn.disabled = false;

if (els.saveEditBtn.dataset.originalHtml) {
    els.saveEditBtn.innerHTML = els.saveEditBtn.dataset.originalHtml;

    delete els.saveEditBtn.dataset.originalHtml;
} else {
    setEditModalMode(modalMode || "edit");
}
}
}

/* =========================================================
BUTTON LOADING — DELETE
========================================================= */

function setDeleteButtonLoading(loading) {
if (!els.confirmDeleteBtn) {
return;
}

if (loading) {
els.confirmDeleteBtn.disabled = true;

els.confirmDeleteBtn.dataset.originalHtml = els.confirmDeleteBtn.innerHTML;

els.confirmDeleteBtn.innerHTML = `
        <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true">
        </span>

        جاري الحذف...
        `;
} else {
els.confirmDeleteBtn.disabled = false;

if (els.confirmDeleteBtn.dataset.originalHtml) {
    els.confirmDeleteBtn.innerHTML =
    els.confirmDeleteBtn.dataset.originalHtml;

    delete els.confirmDeleteBtn.dataset.originalHtml;
}
}
}

/* =========================================================
READ RESPONSE SAFELY
========================================================= */

async function safeReadResponse(response) {
try {
const text = await response.text();

if (!text) {
    return "";
}

try {
    return JSON.parse(text);
} catch {
    return text;
}
} catch {
return "";
}
}

/* =========================================================
API ERROR MESSAGE
========================================================= */

function getApiErrorMessage(error, fallback) {
if (typeof error === "string" && error.trim()) {
return error;
}

if (error?.message) {
return error.message;
}

if (error?.Message) {
return error.Message;
}

if (error?.errors) {
try {
    const messages = Object.values(error.errors).flat().filter(Boolean);

    if (messages.length) {
    return messages.join("\n");
    }
} catch {
    /* Ignore */
}
}

return fallback;
}

/* =========================================================
FORM MESSAGE
========================================================= */

function showFormMessage(message) {
let messageElement = document.getElementById("subjectFormMessage");

if (!messageElement) {
messageElement = document.createElement("div");

messageElement.id = "subjectFormMessage";

messageElement.className = "subject-form-message";

if (els.editSubjectForm) {
    els.editSubjectForm.prepend(messageElement);
}
}

messageElement.innerHTML = `
    <i class="bi bi-exclamation-circle-fill"></i>

    <span>
        ${escapeHtml(message)}
    </span>
    `;

messageElement.classList.add("show");

setTimeout(function () {
messageElement.classList.remove("show");
}, 3500);
}

/* =========================================================
DELETE MESSAGE
========================================================= */

function showDeleteMessage(message) {
let messageElement = document.getElementById("subjectDeleteMessage");

if (!messageElement) {
messageElement = document.createElement("div");

messageElement.id = "subjectDeleteMessage";

messageElement.className = "subject-form-message delete-message";

if (els.subjectDeleteCard) {
    els.subjectDeleteCard.insertBefore(
    messageElement,
    els.subjectDeleteCard.querySelector(".subject-modal-actions"),
    );
}
}

messageElement.innerHTML = `
    <i class="bi bi-exclamation-circle-fill"></i>

    <span>
        ${escapeHtml(message)}
    </span>
    `;

messageElement.classList.add("show");
}

/* =========================================================
CLEAR DELETE MESSAGE
========================================================= */

function clearDeleteMessage() {
const messageElement = document.getElementById("subjectDeleteMessage");

if (messageElement) {
messageElement.classList.remove("show");
}
}

/* =========================================================
SUCCESS MESSAGE
========================================================= */

function showSuccessMessage(message) {
let toast = document.getElementById("subjectSuccessToast");

if (!toast) {
toast = document.createElement("div");

toast.id = "subjectSuccessToast";

toast.className = "subject-success-toast";

document.body.appendChild(toast);
}

toast.innerHTML = `
    <div class="subject-success-icon">
        <i class="bi bi-check-lg"></i>
    </div>

    <div>
        <strong>تم بنجاح</strong>

        <span>
            ${escapeHtml(message)}
        </span>
    </div>
    `;

toast.classList.add("show");

setTimeout(function () {
toast.classList.remove("show");
}, 3000);
}

/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHtml(value) {
return String(value ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}
