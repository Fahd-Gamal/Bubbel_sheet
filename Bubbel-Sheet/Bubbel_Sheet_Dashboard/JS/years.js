"use strict";

/* =========================================================
BUBBLE SHEET
ACADEMIC YEARS PAGE
========================================================= */

/* =========================================================
CONFIG
========================================================= */

const YEARS_API_URL = "/Dashboard/get-years";

const EDIT_YEAR_API_URL = "/Dashboard/edit-year";

const DELETE_YEAR_API_URL = "/Year/delete-year";

const ADMIN_DASHBOARD_API_URL = "/Dashboard/get-Admin-data";

const SKELETON_CARD_COUNT = 3;

/* =========================================================
URL LEVEL
========================================================= */

const urlParams = new URLSearchParams(window.location.search);

const levelParam = urlParams.get("level");

let level = normalizeLevelToNumber(levelParam);

console.log("Current URL:", window.location.href);

console.log("Level Parameter:", levelParam);

console.log("Selected Level:", level);

/* =========================================================
DOM REFERENCES
========================================================= */

const els = {};

/* =========================================================
PAGE STATE
========================================================= */

let currentYears = [];

let editYearModal = null;

let deleteYearModal = null;

let activeEditYear = null;

let activeDeleteYear = null;

let editImageRemoved = false;

/* =========================================================
ANNOUNCEMENT STATE
========================================================= */

let stageAnnouncements = [];

let stageAnnouncementModal = null;

let announcementEls = {};

/* =========================================================
NORMALIZE LEVEL TO NUMBER
========================================================= */

function normalizeLevelToNumber(value) {
if (value === null || value === undefined) {
    return NaN;
}

const stringValue = String(value).trim();

/*
        Numeric:
        1 = ابتدائي
        2 = إعدادي
        3 = ثانوي
    */

if (stringValue === "1") {
    return 1;
}

if (stringValue === "2") {
    return 2;
}

if (stringValue === "3") {
    return 3;
}

/*
        Arabic
    */

if (
    stringValue === "ابتدائي" ||
    stringValue === "الابتدائي" ||
    stringValue === "المرحلة الابتدائية"
) {
    return 1;
}

if (
    stringValue === "إعدادي" ||
    stringValue === "اعدادي" ||
    stringValue === "الإعدادي" ||
    stringValue === "المرحلة الإعدادية"
) {
    return 2;
}

if (
    stringValue === "ثانوي" ||
    stringValue === "الثانوي" ||
    stringValue === "المرحلة الثانوية"
) {
    return 3;
}

/*
        English
    */

const lower = stringValue.toLowerCase();

if (lower.includes("primary") || lower.includes("elementary")) {
    return 1;
}

if (
    lower.includes("preparatory") ||
    lower.includes("prep") ||
    lower.includes("middle")
) {
    return 2;
}

if (lower.includes("secondary") || lower.includes("high")) {
    return 3;
}

return NaN;
}

/* =========================================================
LEVEL NAME
========================================================= */

function getLevelName(levelValue) {
if (levelValue === 1) {
    return "ابتدائي";
}

if (levelValue === 2) {
    return "إعدادي";
}

if (levelValue === 3) {
    return "ثانوي";
}

return "";
}

/* =========================================================
ANNOUNCEMENT HELPERS
========================================================= */

function getAnnouncementValue(object, keys) {
if (!object) {
    return "";
}

for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null) {
        return object[key];
    }
}

return "";
}

/* =========================================================
NORMALIZE ANNOUNCEMENT STAGE
========================================================= */

function normalizeAnnouncementStage(stage) {
if (stage === null || stage === undefined) {
    return "";
}

const value = String(stage).trim();

if (
    value === "ابتدائي" ||
    value === "الابتدائي" ||
    value === "المرحلة الابتدائية"
) {
    return "ابتدائي";
}

if (
    value === "إعدادي" ||
    value === "اعدادي" ||
    value === "الإعدادي" ||
    value === "المرحلة الإعدادية"
) {
    return "إعدادي";
}

if (
    value === "ثانوي" ||
    value === "الثانوي" ||
    value === "المرحلة الثانوية"
) {
    return "ثانوي";
}

if (value === "1") {
    return "ابتدائي";
}

if (value === "2") {
    return "إعدادي";
}

if (value === "3") {
    return "ثانوي";
}

const lower = value.toLowerCase();

if (lower.includes("primary") || lower.includes("elementary")) {
    return "ابتدائي";
}

if (
    lower.includes("preparatory") ||
    lower.includes("prep") ||
    lower.includes("middle")
) {
    return "إعدادي";
}

if (lower.includes("secondary") || lower.includes("high")) {
    return "ثانوي";
}

return value;
}

/* =========================================================
GET ANNOUNCEMENT STAGE
========================================================= */

function getStageAnnouncementStage(announcement) {
const stage = getAnnouncementValue(announcement, [
    "stage",
    "Stage",

    "level",
    "Level",

    "academicStage",
    "AcademicStage",

    "stageName",
    "StageName",

    "levelName",
    "LevelName",

    "academicStageName",
    "AcademicStageName",
]);

return normalizeAnnouncementStage(stage);
}

/* =========================================================
GET ANNOUNCEMENT IMAGE
========================================================= */

function getStageAnnouncementImage(announcement) {
return getAnnouncementValue(announcement, [
    "image",
    "Image",

    "imgLink",
    "ImgLink",

    "imageUrl",
    "ImageUrl",

    "imageURL",
    "ImageURL",

    "img",
    "Img",

    "imgUrl",
    "ImgUrl",

    "imgURL",
    "ImgURL",

    "url",
    "Url",

    "path",
    "Path",

    "filePath",
    "FilePath",

    "fileUrl",
    "FileUrl",

    "imagePath",
    "ImagePath",
]);
}

/* =========================================================
BUILD IMAGE URL
========================================================= */

function buildStageImageUrl(image) {
if (!image) {
    return "";
}

const value = String(image).trim();

if (!value) {
    return "";
}

/*
        Base64
    */

if (value.startsWith("data:image")) {
    return value;
}

/*
        Full URL
    */

if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
) {
    return value;
}

/*
        API base URL

        api موجود بالفعل في auth.js
        حسب مشروعك.
    */

if (typeof api !== "undefined" && api) {
    const base = String(api).replace(/\/$/, "");

    if (value.startsWith("/")) {
        return `${base}${value}`;
    }

    return `${base}/${value}`;
}

return value;
}

/* =========================================================
GET CURRENT STAGE ANNOUNCEMENT
========================================================= */

function getCurrentStageAnnouncement() {
if (!Array.isArray(stageAnnouncements) || stageAnnouncements.length === 0) {
    return null;
}

const currentStage = getLevelName(level);

if (!currentStage) {
    return null;
}

const announcement = stageAnnouncements.find(function (item) {
    const announcementStage = getStageAnnouncementStage(item);

    return normalizeAnnouncementStage(announcementStage) === currentStage;
});

return announcement || null;
}

/* =========================================================
CACHE DOM
========================================================= */

function cacheDom() {
/* =========================
        MAIN PAGE
    ========================= */

els.skeletonGrid = document.getElementById("skeletonGrid");

els.yearsGrid = document.getElementById("yearsGrid");

els.emptyState = document.getElementById("emptyState");

els.errorState = document.getElementById("errorState");

els.emptyRetryBtn = document.getElementById("emptyRetryBtn");

els.errorRetryBtn = document.getElementById("errorRetryBtn");

/* =========================
        EDIT MODAL
    ========================= */

els.editYearModalEl = document.getElementById("editYearModal");

els.editYearForm = document.getElementById("editYearForm");

els.editYearId = document.getElementById("editYearId");

els.editYearName = document.getElementById("editYearName");

els.editYearNameError = document.getElementById("editYearNameError");

els.editImagePreview = document.getElementById("editImagePreview");

els.editYearImage = document.getElementById("editYearImage");

els.editRemoveImageBtn = document.getElementById("editRemoveImageBtn");

els.editYearSaveBtn = document.getElementById("editYearSaveBtn");

/* =========================
        DELETE MODAL
    ========================= */

els.deleteYearModalEl = document.getElementById("deleteYearModal");

els.deleteYearName = document.getElementById("deleteYearName");

els.confirmDeleteYearBtn = document.getElementById("confirmDeleteYearBtn");
}

/* =========================================================
VISIBILITY
========================================================= */

function toggleVisibility(element, visible) {
if (!element) {
    return;
}

element.classList.toggle("d-none", !visible);
}

/* =========================================================
SKELETON
========================================================= */

function showSkeleton() {
toggleVisibility(els.skeletonGrid, true);

toggleVisibility(els.yearsGrid, false);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, false);
}

/* =========================================================
SHOW YEARS
========================================================= */

function showYears() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.yearsGrid, true);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, false);
}

/* =========================================================
SHOW EMPTY
========================================================= */

function showEmpty() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.yearsGrid, false);

toggleVisibility(els.emptyState, true);

toggleVisibility(els.errorState, false);
}

/* =========================================================
SHOW ERROR
========================================================= */

function showError() {
toggleVisibility(els.skeletonGrid, false);

toggleVisibility(els.yearsGrid, false);

toggleVisibility(els.emptyState, false);

toggleVisibility(els.errorState, true);
}

/* =========================================================
RETRY BUTTONS
========================================================= */

function bindRetryButtons() {
if (els.emptyRetryBtn) {
    els.emptyRetryBtn.addEventListener("click", function () {
        loadYears();
    });
}

if (els.errorRetryBtn) {
    els.errorRetryBtn.addEventListener("click", function () {
        loadYears();
    });
}
}

/* =========================================================
LOAD ANNOUNCEMENTS FROM API
========================================================= */

async function loadStageAnnouncements() {
try {
    if (typeof apiRequest !== "function") {
        console.error("apiRequest() is not available.");

        return;
    }

    let response = await apiRequest(ADMIN_DASHBOARD_API_URL, {
        method: "GET",
    });

    console.log("Announcement API Status:", response.status);

    /* =========================
            TOKEN EXPIRED
        ========================= */

    if (response.status === 401) {
        console.log("Announcement request returned 401. Refreshing token...");

        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "login.html";

            return;
        }

        response = await apiRequest(ADMIN_DASHBOARD_API_URL, {
            method: "GET",
        });
    }

    /* =========================
            STILL UNAUTHORIZED
        ========================= */

    if (response.status === 401) {
        window.location.href = "login.html";

        return;
    }

    /* =========================
            OTHER ERRORS
        ========================= */

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Announcement API Error:", response.status, errorText);

        return;
    }

    /* =========================
            PARSE
        ========================= */

    const data = await response.json();

    console.log("Admin Dashboard Response:", data);

    const root = data?.data || data?.result || data;

    /*
            API:

            {
                countOfStudent: 17,
                years: [],
                imgAds: []
            }
        */

    if (Array.isArray(root?.imgAds)) {
        stageAnnouncements = root.imgAds;
    } else if (Array.isArray(root?.ImgAds)) {
        stageAnnouncements = root.ImgAds;
    } else {
        stageAnnouncements = [];
    }

    console.log("Stage Announcements:", stageAnnouncements);

    /*
            Show current stage announcement
            after API data arrives.
        */

    showStageAnnouncement();
} catch (error) {
    console.error("Failed to load stage announcements:", error);
}
}

/* =========================================================
INIT STAGE ANNOUNCEMENT
========================================================= */

function initStageAnnouncement() {
const modalElement = document.getElementById("stageAnnouncementModal");

if (!modalElement) {
    console.warn("Stage announcement modal not found.");

    return;
}

if (typeof bootstrap === "undefined") {
    console.warn("Bootstrap is not loaded.");

    return;
}

announcementEls.badge = document.getElementById("stageAnnouncementBadge");

announcementEls.title = document.getElementById("stageAnnouncementTitle");

announcementEls.subtitle = document.getElementById(
    "stageAnnouncementSubtitle",
);

announcementEls.image = document.getElementById("stageAnnouncementImage");

announcementEls.fallback = document.getElementById(
    "stageAnnouncementFallback",
);

announcementEls.footer = document.getElementById(
    "stageAnnouncementFooterText",
);

stageAnnouncementModal = new bootstrap.Modal(modalElement, {
    backdrop: true,
    keyboard: true,
});
}

/* =========================================================
SHOW STAGE ANNOUNCEMENT
========================================================= */

function showStageAnnouncement() {
const announcement = getCurrentStageAnnouncement();

/*
        No announcement
    */

if (!announcement) {
    console.log("No announcement found for level:", level);

    return;
}

const rawImage = getStageAnnouncementImage(announcement);

const image = buildStageImageUrl(rawImage);

console.log("Current announcement:", announcement);

console.log("Raw announcement image:", rawImage);

console.log("Final announcement image:", image);

/* =========================
        STAGE NAME
    ========================= */

const stageName = getLevelName(level);

/* =========================
        BADGE
    ========================= */

if (announcementEls.badge) {
    announcementEls.badge.textContent = `إعلان المرحلة ${stageName}`;
}

/* =========================
        TITLE
    ========================= */

if (announcementEls.title) {
    announcementEls.title.textContent = `إعلان هام لطلاب المرحلة ${stageName}`;
}

/* =========================
        SUBTITLE
    ========================= */

if (announcementEls.subtitle) {
    announcementEls.subtitle.textContent =
        "برجاء الاطلاع على الإعلان الخاص بمرحلتك الدراسية";
}

/* =========================
        FOOTER
    ========================= */

if (announcementEls.footer) {
    announcementEls.footer.textContent = "نتمنى لكم التوفيق والنجاح";
}

/* =========================
        IMAGE
    ========================= */

if (announcementEls.image) {
    announcementEls.image.onerror = null;

    /*
            Hide image first.
        */

    announcementEls.image.classList.add("d-none");

    if (announcementEls.fallback) {
        announcementEls.fallback.classList.add("d-none");
    }

    /*
            No image.
        */

    if (!image) {
        if (announcementEls.fallback) {
            announcementEls.fallback.classList.remove("d-none");
        }
    } else {
        /*
                Image exists.
            */
        announcementEls.image.src = image;

        announcementEls.image.alt = `إعلان المرحلة ${stageName}`;

        announcementEls.image.onload = function () {
            announcementEls.image.classList.remove("d-none");

            if (announcementEls.fallback) {
                announcementEls.fallback.classList.add("d-none");
            }
        };

        announcementEls.image.onerror = function () {
            console.error("Failed to load announcement image:", image);

            announcementEls.image.classList.add("d-none");

            if (announcementEls.fallback) {
                announcementEls.fallback.classList.remove("d-none");
            }
        };
    }
}

/* =========================
        SHOW MODAL
    ========================= */

if (stageAnnouncementModal) {
    setTimeout(function () {
        stageAnnouncementModal.show();
    }, 500);
}
}

/* =========================================================
LOAD YEARS
========================================================= */

async function loadYears() {
if (![1, 2, 3].includes(level)) {
    console.error("Cannot load years because level is invalid:", level);

    showError();

    return;
}

showSkeleton();

const requestUrl = `${YEARS_API_URL}?level=${encodeURIComponent(level)}`;

console.log("Loading years from:", requestUrl);

try {
    if (typeof apiRequest !== "function") {
        throw new Error("apiRequest() is not available.");
    }

    let response = await apiRequest(requestUrl, {
        method: "GET",
    });

    console.log("Years API Status:", response.status);

    /* =========================
            TOKEN EXPIRED
        ========================= */

    if (response.status === 401) {
        console.log("Years request returned 401. Refreshing token...");

        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "login.html";

            return;
        }

        response = await apiRequest(requestUrl, {
            method: "GET",
        });

        console.log("Years API Retry Status:", response.status);
    }

    /* =========================
            STILL UNAUTHORIZED
        ========================= */

    if (response.status === 401) {
        window.location.href = "login.html";

        return;
    }

    /* =========================
            API ERROR
        ========================= */

    if (!response.ok) {
        let errorText = "";

        try {
            errorText = await response.text();
        } catch {
            errorText = "Unable to read error response.";
        }

        console.error("Years API Error:", response.status, errorText);

        showError();

        return;
    }

    /* =========================
            PARSE RESPONSE
        ========================= */

    const years = await response.json();

    console.log("Years Data:", years);

    /* =========================
            EMPTY
        ========================= */

    if (!Array.isArray(years) || years.length === 0) {
        currentYears = [];

        showEmpty();

        return;
    }

    /* =========================
            RENDER
        ========================= */

    renderYearCards(years);

    showYears();
} catch (error) {
    console.error("Failed to load academic years:", error);

    showError();
}
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

col.className = "col-lg-4 col-md-6 col-12";

const card = document.createElement("div");

card.className = "gc skeleton-card";

card.setAttribute("aria-hidden", "true");

const banner = document.createElement("div");

banner.className = "skeleton-shape skeleton-banner";

const body = document.createElement("div");

body.className = "skeleton-body";

const line = document.createElement("div");

line.className = "skeleton-shape skeleton-line";

const button = document.createElement("div");

button.className = "skeleton-shape skeleton-btn";

body.appendChild(line);

body.appendChild(button);

card.appendChild(banner);

card.appendChild(body);

col.appendChild(card);

return col;
}

/* =========================================================
RENDER YEAR CARDS
========================================================= */

function renderYearCards(years) {
if (!els.yearsGrid) {
    return;
}

currentYears = Array.isArray(years) ? years : [];

const fragment = document.createDocumentFragment();

currentYears.forEach(function (year) {
    fragment.appendChild(buildYearCard(year));
});

els.yearsGrid.innerHTML = "";

els.yearsGrid.appendChild(fragment);
}

/* =========================================================
BUILD YEAR CARD
========================================================= */

function buildYearCard(year) {
const col = document.createElement("div");

col.className = "col-lg-4 col-md-6 col-12";

col.setAttribute("role", "listitem");

const card = document.createElement("div");

card.className = "gc year-card";

card.setAttribute("tabindex", "0");

card.setAttribute("role", "button");

const yearName = year?.yearName || year?.YearName || "عام دراسي";

card.setAttribute("aria-label", `فتح المواد ${yearName}`);

/* =========================
        BAR
    ========================= */

const bar = document.createElement("div");

bar.className = "gc-bar";

/* =========================
        MEDIA
    ========================= */

const media = buildYearMedia(year);

/* =========================
        ACTIONS
    ========================= */

const actions = buildYearActions(year);

/* =========================
        BODY
    ========================= */

const body = document.createElement("div");

body.className = "year-body";

/* =========================
        NAME
    ========================= */

const name = document.createElement("h3");

name.className = "year-name";

name.textContent = yearName;

/* =========================
        BUTTON
    ========================= */

const button = document.createElement("button");

button.type = "button";

button.className = "year-btn";

button.innerHTML = `فتح المواد
    <i
        class="bi bi-arrow-left"
        aria-hidden="true">
    </i>`;

/* =========================
        OPEN YEAR
    ========================= */

function handleOpen(event) {
    if (event) {
        event.stopPropagation();
    }

    openYear(year?.yearId);
}

card.addEventListener("click", handleOpen);

card.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        handleOpen(event);
    }
});

button.addEventListener("click", handleOpen);

/* =========================
        APPEND
    ========================= */

body.appendChild(name);

body.appendChild(button);

card.appendChild(bar);

card.appendChild(media);

card.appendChild(actions);

card.appendChild(body);

col.appendChild(card);

return col;
}

/* =========================================================
YEAR ACTIONS
========================================================= */

function buildYearActions(year) {
const wrap = document.createElement("div");

wrap.className = "year-actions";

/* =========================
        EDIT
    ========================= */

const editBtn = document.createElement("button");

editBtn.type = "button";

editBtn.className = "year-action-btn year-edit-btn";

editBtn.setAttribute("aria-label", `تعديل ${year?.yearName || ""}`);

editBtn.innerHTML = `<i class="bi bi-pencil-fill"></i>`;

editBtn.addEventListener("click", function (event) {
    event.stopPropagation();

    openEditYearModal(year);
});

/* =========================
        DELETE
    ========================= */

const deleteBtn = document.createElement("button");

deleteBtn.type = "button";

deleteBtn.className = "year-action-btn year-delete-btn";

deleteBtn.setAttribute("aria-label", `حذف ${year?.yearName || ""}`);

deleteBtn.innerHTML = `<i class="bi bi-trash3-fill"></i>`;

deleteBtn.addEventListener("click", function (event) {
    event.stopPropagation();

    openDeleteYearModal(year);
});

wrap.appendChild(editBtn);

wrap.appendChild(deleteBtn);

return wrap;
}

/* =========================================================
YEAR MEDIA
========================================================= */

function buildYearMedia(year) {
const media = document.createElement("div");

media.className = "year-media";

media.setAttribute("aria-hidden", "true");

const imageUrl = typeof year?.imgLink === "string" ? year.imgLink.trim() : "";

if (imageUrl) {
    const img = document.createElement("img");

    img.className = "year-img";

    img.src = imageUrl;

    img.alt = year?.yearName || "العام الدراسي";

    img.loading = "lazy";

    img.addEventListener(
        "error",
        function () {
            media.innerHTML = buildFallbackIconMarkup();
        },
        {
            once: true,
        },
    );

    media.appendChild(img);
} else {
    media.innerHTML = buildFallbackIconMarkup();
}

return media;
}

/* =========================================================
FALLBACK
========================================================= */

function buildFallbackIconMarkup() {
return `
    <div class="year-icon">
        <i class="bi bi-mortarboard-fill"></i>
    </div>
`;
}

/* =========================================================
OPEN YEAR
========================================================= */

function openYear(yearId) {
if (yearId === null || yearId === undefined || yearId === "") {
    console.error("Invalid Year ID:", yearId);

    return;
}

console.log("Opening year:", yearId, "level:", level);

window.location.href = `subject.html?yearId=${encodeURIComponent(
    yearId,
)}&level=${encodeURIComponent(level)}`;
}

/* =========================================================
TEACHER MODALS
========================================================= */

function initTeacherModals() {
if (typeof bootstrap === "undefined") {
    console.warn("Bootstrap is not loaded.");

    return;
}

if (els.editYearModalEl) {
    editYearModal = new bootstrap.Modal(els.editYearModalEl);
}

if (els.deleteYearModalEl) {
    deleteYearModal = new bootstrap.Modal(els.deleteYearModalEl);
}

bindEditYearForm();

bindDeleteYearConfirm();
}

/* =========================================================
OPEN EDIT MODAL
========================================================= */

function openEditYearModal(year) {
if (!editYearModal) {
    console.error("Edit modal is not initialized.");

    return;
}

activeEditYear = year;

editImageRemoved = false;

clearEditFormErrors();

if (els.editYearId) {
    els.editYearId.value = year?.yearId || "";
}

if (els.editYearName) {
    els.editYearName.value = year?.yearName || "";
}

if (els.editYearImage) {
    els.editYearImage.value = "";
}

renderEditImagePreview(year?.imgLink || "");

setEditSaving(false);

editYearModal.show();
}

/* =========================================================
EDIT IMAGE PREVIEW
========================================================= */

function renderEditImagePreview(src) {
if (!els.editImagePreview) {
    return;
}

els.editImagePreview.innerHTML = "";

if (src) {
    const img = document.createElement("img");

    img.src = src;

    img.alt = "معاينة الصورة";

    img.onerror = function () {
        renderEditImagePreview("");
    };

    els.editImagePreview.appendChild(img);

    toggleVisibility(els.editRemoveImageBtn, true);
} else {
    els.editImagePreview.innerHTML = `<i class="bi bi-image"></i>`;

    toggleVisibility(els.editRemoveImageBtn, false);
}
}

/* =========================================================
EDIT FORM EVENTS
========================================================= */

function bindEditYearForm() {
if (els.editYearImage) {
    els.editYearImage.addEventListener("change", function (event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            event.target.value = "";

            return;
        }

        editImageRemoved = false;

        const reader = new FileReader();

        reader.onload = function (e) {
            renderEditImagePreview(e.target.result);
        };

        reader.readAsDataURL(file);
    });
}

if (els.editRemoveImageBtn) {
    els.editRemoveImageBtn.addEventListener("click", function () {
        editImageRemoved = true;

        if (els.editYearImage) {
            els.editYearImage.value = "";
        }

        renderEditImagePreview("");
    });
}

if (els.editYearForm) {
    els.editYearForm.addEventListener("submit", handleEditYearSubmit);
}
}

/* =========================================================
CLEAR EDIT ERRORS
========================================================= */

function clearEditFormErrors() {
if (els.editYearName) {
    els.editYearName.classList.remove("is-invalid");
}

toggleVisibility(els.editYearNameError, false);
}

/* =========================================================
EDIT LOADING
========================================================= */

function setEditSaving(isSaving) {
if (!els.editYearSaveBtn) {
    return;
}

els.editYearSaveBtn.disabled = isSaving;

const textEl = els.editYearSaveBtn.querySelector(".ay-btn-save-text");

const spinnerEl = els.editYearSaveBtn.querySelector(".ay-btn-spinner");

toggleVisibility(textEl, !isSaving);

toggleVisibility(spinnerEl, isSaving);
}

/* =========================================================
EDIT SUBMIT
========================================================= */

async function handleEditYearSubmit(event) {
event.preventDefault();

if (!activeEditYear) {
    return;
}

const newName = els.editYearName ? els.editYearName.value.trim() : "";

if (!newName) {
    if (els.editYearName) {
        els.editYearName.classList.add("is-invalid");
    }

    toggleVisibility(els.editYearNameError, true);

    return;
}

clearEditFormErrors();

setEditSaving(true);

try {
    const formData = new FormData();

    formData.append("Id", activeEditYear.yearId);

    formData.append("YearName", newName);

    if (
        els.editYearImage &&
        els.editYearImage.files &&
        els.editYearImage.files[0]
    ) {
        formData.append("img", els.editYearImage.files[0]);
    }

    if (editImageRemoved) {
        formData.append("RemoveImage", "true");
    }

    let response = await apiRequest("/Year/edit-year", {
        method: "PUT",
        body: formData,
    });

    /* =========================
            401
        ========================= */

    if (response.status === 401) {
        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "login.html";

            return;
        }

        response = await apiRequest(EDIT_YEAR_API_URL, {
            method: "PUT",
            body: formData,
        });
    }

    if (response.status === 401) {
        window.location.href = "login.html";

        return;
    }

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Edit Year API Error:", response.status, errorText);

        setEditSaving(false);

        return;
    }

    let updated = null;

    try {
        updated = await response.json();
    } catch {
        updated = null;
    }

    applyYearUpdate(activeEditYear.yearId, updated);

    setEditSaving(false);

    if (editYearModal) {
        editYearModal.hide();
    }
} catch (error) {
    console.error("Failed to save year:", error);

    setEditSaving(false);
}
}

/* =========================================================
APPLY YEAR UPDATE
========================================================= */

function applyYearUpdate(yearId, updated) {
const index = currentYears.findIndex(function (year) {
    return String(year.yearId) === String(yearId);
});

if (index === -1) {
    return;
}

currentYears[index] = Object.assign({}, currentYears[index], updated || {});

renderYearCards(currentYears);
}

/* =========================================================
OPEN DELETE MODAL
========================================================= */

function openDeleteYearModal(year) {
if (!deleteYearModal) {
    console.error("Delete modal is not initialized.");

    return;
}

activeDeleteYear = year;

if (els.deleteYearName) {
    els.deleteYearName.textContent = year?.yearName || "هذا العام الدراسي";
}

setDeleteLoading(false);

deleteYearModal.show();
}

/* =========================================================
DELETE LOADING
========================================================= */

function setDeleteLoading(isDeleting) {
if (!els.confirmDeleteYearBtn) {
    return;
}

els.confirmDeleteYearBtn.disabled = isDeleting;

const textEl = els.confirmDeleteYearBtn.querySelector(".ay-btn-save-text");

const spinnerEl = els.confirmDeleteYearBtn.querySelector(".ay-btn-spinner");

toggleVisibility(textEl, !isDeleting);

toggleVisibility(spinnerEl, isDeleting);
}

/* =========================================================
DELETE EVENT
========================================================= */

function bindDeleteYearConfirm() {
if (!els.confirmDeleteYearBtn) {
    return;
}

els.confirmDeleteYearBtn.addEventListener("click", handleConfirmDeleteYear);
}

/* =========================================================
CONFIRM DELETE
========================================================= */

async function handleConfirmDeleteYear() {
if (!activeDeleteYear) {
    return;
}

setDeleteLoading(true);

try {
    const yearId = activeDeleteYear.yearId;

    let response = await apiRequest(
        `${DELETE_YEAR_API_URL}?yearId=${encodeURIComponent(yearId)}`,
        {
            method: "DELETE",
        },
    );

    /* =========================
            TOKEN EXPIRED
        ========================= */

    if (response.status === 401) {
        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "login.html";

            return;
        }

        response = await apiRequest(
            `${DELETE_YEAR_API_URL}?Id=${encodeURIComponent(yearId)}`,
            {
                method: "DELETE",
            },
        );
    }

    if (response.status === 401) {
        window.location.href = "login.html";

        return;
    }

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Delete Year API Error:", response.status, errorText);

        setDeleteLoading(false);

        return;
    }

    removeYearLocally(yearId);

    setDeleteLoading(false);

    if (deleteYearModal) {
        deleteYearModal.hide();
    }
} catch (error) {
    console.error("Failed to delete year:", error);

    setDeleteLoading(false);
}
}

/* =========================================================
REMOVE YEAR LOCALLY
========================================================= */

function removeYearLocally(yearId) {
currentYears = currentYears.filter(function (year) {
    return String(year.yearId) !== String(yearId);
});

if (currentYears.length === 0) {
    showEmpty();

    return;
}

renderYearCards(currentYears);

showYears();
}

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
console.log("Academic Years Page initializing...");

/* =========================
            DOM
        ========================= */

cacheDom();

/* =========================
            SKELETON
        ========================= */

renderSkeletonCards();

/* =========================
            RETRY
        ========================= */

bindRetryButtons();

/* =========================
            BOOTSTRAP MODALS
        ========================= */

initTeacherModals();

/* =========================
            ANNOUNCEMENT MODAL
        ========================= */

initStageAnnouncement();

/* =========================
            VALIDATE LEVEL
        ========================= */

if (![1, 2, 3].includes(level)) {
    console.error("Invalid academic level:", level);

    showError();

    return;
}

console.log("Valid academic level:", level);

/* =========================
        AUTHENTICATION
        ========================= */

try {
    if (typeof refreshToken !== "function") {
        console.error("refreshToken() is not available.");

        window.location.href = "login.html";

        return;
    }

    const refreshed = await refreshToken();

    if (!refreshed) {
        console.error("Authentication failed.");

        window.location.href = "login.html";

        return;
    }
} catch (error) {
    console.error("Authentication error:", error);

    window.location.href = "login.html";

    return;
}

/* =========================
        LOAD ANNOUNCEMENTS
        ========================= */

await loadStageAnnouncements();

/* =========================
            LOAD YEARS
        ========================= */

await loadYears();

console.log("Academic Years Page loaded successfully.");
});
