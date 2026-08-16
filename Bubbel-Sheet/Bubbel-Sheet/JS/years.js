"use strict";

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initYearsPage();
});


/* =========================================================
   CONFIG
========================================================= */

const YEARS_API_URL = "/Dashboard/get-years";

const ANNOUNCEMENT_API_URL = "/Ad/get-imgad";

/*
    CDN الخاص بصور السنين
*/
const CDN_BASE_URL = "https://fahdgamal.b-cdn.net";

const SKELETON_CARD_COUNT = 3;


/* =========================================================
   GET LEVEL FROM URL
========================================================= */

const urlParams = new URLSearchParams(
    window.location.search
);

const level = Number(
    urlParams.get("level")
);

console.log("Selected Level:", level);


/* =========================================================
   DOM REFERENCES
========================================================= */

const els = {};

function cacheDom() {

    /* =========================
       YEARS
    ========================= */

    els.skeletonGrid =
        document.getElementById("skeletonGrid");

    els.yearsGrid =
        document.getElementById("yearsGrid");

    els.emptyState =
        document.getElementById("emptyState");

    els.errorState =
        document.getElementById("errorState");

    els.emptyRetryBtn =
        document.getElementById("emptyRetryBtn");

    els.errorRetryBtn =
        document.getElementById("errorRetryBtn");


    /* =========================
       ANNOUNCEMENT
    ========================= */

    els.stageAnnouncementModal =
        document.getElementById(
            "stageAnnouncementModal"
        );

    els.stageAnnouncementImage =
        document.getElementById(
            "stageAnnouncementImage"
        );

    els.stageAnnouncementFallback =
        document.getElementById(
            "stageAnnouncementFallback"
        );

    els.stageAnnouncementTitle =
        document.getElementById(
            "stageAnnouncementTitle"
        );

    els.stageAnnouncementSubtitle =
        document.getElementById(
            "stageAnnouncementSubtitle"
        );

    els.stageAnnouncementBadge =
        document.getElementById(
            "stageAnnouncementBadge"
        );

    els.stageAnnouncementFooterText =
        document.getElementById(
            "stageAnnouncementFooterText"
        );
}


/* =========================================================
   INIT
========================================================= */

async function initYearsPage() {

    cacheDom();

    renderSkeletonCards();

    bindRetryButtons();


    /* =====================================================
       CHECK LEVEL
    ===================================================== */

    if (![1, 2, 3].includes(level)) {

        console.error(
            "Invalid level:",
            level
        );

        showError();

        return;
    }


    /* =====================================================
       AUTH
    ===================================================== */

    const refreshed =
        await refreshToken();

    if (!refreshed) {

        window.location.href =
            "login.html";

        return;
    }


    /* =====================================================
       LOAD YEARS
    ===================================================== */

    await loadYears();


    /* =====================================================
       LOAD ANNOUNCEMENT
    ===================================================== */

    await loadStageAnnouncement();
}


/* =========================================================
   RETRY BUTTONS
========================================================= */

function bindRetryButtons() {

    if (els.emptyRetryBtn) {

        els.emptyRetryBtn.addEventListener(
            "click",
            loadYears
        );
    }

    if (els.errorRetryBtn) {

        els.errorRetryBtn.addEventListener(
            "click",
            loadYears
        );
    }
}


/* =========================================================
   STATE HELPERS
========================================================= */

function showSkeleton() {

    toggleVisibility(
        els.skeletonGrid,
        true
    );

    toggleVisibility(
        els.yearsGrid,
        false
    );

    toggleVisibility(
        els.emptyState,
        false
    );

    toggleVisibility(
        els.errorState,
        false
    );
}


function showYears() {

    toggleVisibility(
        els.skeletonGrid,
        false
    );

    toggleVisibility(
        els.yearsGrid,
        true
    );

    toggleVisibility(
        els.emptyState,
        false
    );

    toggleVisibility(
        els.errorState,
        false
    );
}


function showEmpty() {

    toggleVisibility(
        els.skeletonGrid,
        false
    );

    toggleVisibility(
        els.yearsGrid,
        false
    );

    toggleVisibility(
        els.emptyState,
        true
    );

    toggleVisibility(
        els.errorState,
        false
    );
}


function showError() {

    toggleVisibility(
        els.skeletonGrid,
        false
    );

    toggleVisibility(
        els.yearsGrid,
        false
    );

    toggleVisibility(
        els.emptyState,
        false
    );

    toggleVisibility(
        els.errorState,
        true
    );
}


function toggleVisibility(
    element,
    isVisible
) {

    if (!element) {
        return;
    }

    element.classList.toggle(
        "d-none",
        !isVisible
    );
}


/* =========================================================
   LOAD YEARS
========================================================= */

async function loadYears() {

    showSkeleton();

    try {

        /*
            level 1 = ابتدائي
            level 2 = إعدادي
            level 3 = ثانوي
        */

        const yearsUrl =
            `${YEARS_API_URL}?level=${encodeURIComponent(level)}`;

        console.log(
            "Loading Years:",
            yearsUrl
        );

        let response =
            await apiRequest(
                yearsUrl,
                {
                    method: "GET"
                }
            );


        console.log(
            "Years API Response:",
            response
        );


        /* =================================================
           TOKEN EXPIRED
        ================================================= */

        if (response.status === 401) {

            const refreshed =
                await refreshToken();

            if (!refreshed) {

                window.location.href =
                    "login.html";

                return;
            }

            response =
                await apiRequest(
                    yearsUrl,
                    {
                        method: "GET"
                    }
                );
        }


        /* =================================================
           FINAL AUTH CHECK
        ================================================= */

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        /* =================================================
           API ERROR
        ================================================= */

        if (!response.ok) {

            console.error(
                "Years API Error:",
                response.status
            );

            showError();

            return;
        }


        /* =================================================
           RESPONSE
        ================================================= */

        const years =
            await response.json();

        console.log(
            "Years Data:",
            years
        );


        /* =================================================
           EMPTY
        ================================================= */

        if (
            !Array.isArray(years) ||
            years.length === 0
        ) {

            showEmpty();

            return;
        }


        /* =================================================
           RENDER
        ================================================= */

        renderYearCards(years);

        showYears();

    } catch (error) {

        console.error(
            "Failed to load academic years:",
            error
        );

        showError();
    }
}


/* =========================================================
   LOAD STAGE ANNOUNCEMENT
========================================================= */
async function loadStageAnnouncement() {

    try {

        console.log(
            "Loading stage announcement..."
        );

        /*
            level:
            1 = ابتدائي
            2 = إعدادي
            3 = ثانوي
        */

        const announcementUrl =
            `${ANNOUNCEMENT_API_URL}?level=${encodeURIComponent(level)}`;

        console.log(
            "Announcement API URL:",
            announcementUrl
        );

        let response =
            await apiRequest(
                announcementUrl,
                {
                    method: "GET"
                }
            );

        console.log(
            "Announcement API Response:",
            response
        );


        /* =================================================
           TOKEN EXPIRED
        ================================================= */

        if (response.status === 401) {

            const refreshed =
                await refreshToken();

            if (!refreshed) {

                window.location.href =
                    "login.html";

                return;
            }

            response =
                await apiRequest(
                    announcementUrl,
                    {
                        method: "GET"
                    }
                );
        }


        /* =================================================
           FINAL AUTH CHECK
        ================================================= */

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        /* =================================================
           API ERROR
        ================================================= */

        if (!response.ok) {

            console.error(
                "Announcement API Error:",
                response.status
            );

            return;
        }


        /* =================================================
           RESPONSE
        ================================================= */

        const data =
            await response.json();

        console.log(
            "Announcement API Data:",
            data
        );


        /* =================================================
           API RETURNS SINGLE OBJECT
           
           Example:
           {
               id: 2,
               imgLink: "...",
               img: null,
               level: 1
           }
        ================================================= */

        if (
            !data ||
            typeof data !== "object"
        ) {

            console.log(
                "No announcement data found."
            );

            return;
        }


        /* =================================================
           CHECK LEVEL
        ================================================= */

        const announcementLevel =
            Number(
                data.level
            );

        console.log(
            "Announcement Level:",
            announcementLevel
        );


        if (
            announcementLevel !== level
        ) {

            console.log(
                "Announcement does not belong to current level."
            );

            return;
        }


        /* =================================================
           GET IMAGE
        ================================================= */

        const imageUrl =
            data.imgLink ||
            data.imageUrl ||
            data.image ||
            data.img ||
            "";

        console.log(
            "Announcement Image:",
            imageUrl
        );


        if (!imageUrl) {

            console.log(
                "Announcement has no image."
            );

            return;
        }


        /* =================================================
           RENDER ANNOUNCEMENT
        ================================================= */

        renderStageAnnouncement({
            ...data,
            imgLink: imageUrl
        });


    } catch (error) {

        console.error(
            "Failed to load stage announcement:",
            error
        );

    }
}

/* =========================================================
   GET ANNOUNCEMENTS ARRAY
========================================================= */

function getAnnouncementsArray(root) {

    if (!root) {
        return [];
    }


    /* =====================================================
       API RETURNS ARRAY DIRECTLY
    ===================================================== */

    if (Array.isArray(root)) {
        return root;
    }


    /* =====================================================
       POSSIBLE PROPERTY NAMES
    ===================================================== */

    const possibleKeys = [

        "imgAds",
        "ImgAds",

        "imageAds",
        "ImageAds",

        "announcements",
        "Announcements",

        "ads",
        "Ads",

        "data",
        "Data",

        "items",
        "Items",

        "results",
        "Results"
    ];


    for (const key of possibleKeys) {

        if (
            Array.isArray(root[key])
        ) {

            return root[key];
        }
    }


    return [];
}


/* =========================================================
   FIND ANNOUNCEMENT FOR LEVEL
========================================================= */

function findAnnouncementForLevel(
    announcements,
    currentLevel
) {

    if (
        !Array.isArray(announcements) ||
        announcements.length === 0
    ) {

        return null;
    }


    const currentStage =
        normalizeStageName(
            currentLevel
        );


    console.log(
        "Current Stage:",
        currentStage
    );


    const announcement =
        announcements.find(
            function (item) {

                const announcementStage =
                    getAnnouncementStage(
                        item
                    );


                const normalizedAnnouncementStage =
                    normalizeStageName(
                        announcementStage
                    );


                console.log(
                    "Checking Announcement:",
                    {
                        announcementStage,
                        normalizedAnnouncementStage,
                        currentStage
                    }
                );


                return (
                    normalizedAnnouncementStage ===
                    currentStage
                );
            }
        );


    return announcement || null;
}


/* =========================================================
   NORMALIZE STAGE NAME
========================================================= */

function normalizeStageName(stage) {

    if (
        stage === null ||
        stage === undefined
    ) {

        return "";
    }


    const value =
        String(stage).trim();


    /* =====================================================
       NUMERIC
    ===================================================== */

    if (value === "1") {
        return "ابتدائي";
    }


    if (value === "2") {
        return "إعدادي";
    }


    if (value === "3") {
        return "ثانوي";
    }


    /* =====================================================
       ARABIC
    ===================================================== */

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
        value === "الاعدادي" ||
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


    /* =====================================================
       ENGLISH
    ===================================================== */

    const lower =
        value.toLowerCase();


    if (
        lower.includes("primary") ||
        lower.includes("elementary")
    ) {

        return "ابتدائي";
    }


    if (
        lower.includes("preparatory") ||
        lower.includes("prep") ||
        lower.includes("middle")
    ) {

        return "إعدادي";
    }


    if (
        lower.includes("secondary") ||
        lower.includes("high")
    ) {

        return "ثانوي";
    }


    return value;
}


/* =========================================================
   GET ANNOUNCEMENT STAGE
========================================================= */

function getAnnouncementStage(
    announcement
) {

    if (!announcement) {
        return "";
    }


    const keys = [

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

        "educationStage",
        "EducationStage",

        "educationStageName",
        "EducationStageName"
    ];


    for (const key of keys) {

        if (
            announcement[key] !== undefined &&
            announcement[key] !== null &&
            String(
                announcement[key]
            ).trim() !== ""
        ) {

            return announcement[key];
        }
    }


    return "";
}


/* =========================================================
   GET ANNOUNCEMENT IMAGE
========================================================= */

function getAnnouncementImage(
    announcement
) {

    if (!announcement) {
        return "";
    }


    const keys = [

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
        "ImagePath"
    ];


    for (const key of keys) {

        if (
            announcement[key] !== undefined &&
            announcement[key] !== null &&
            String(
                announcement[key]
            ).trim() !== ""
        ) {

            return announcement[key];
        }
    }


    return "";
}


/* =========================================================
   BUILD GENERIC IMAGE URL
========================================================= */

function buildImageUrl(image) {

    if (!image) {
        return "";
    }


    const value =
        String(image).trim();


    if (!value) {
        return "";
    }


    /* =====================================================
       BASE64
    ===================================================== */

    if (
        value.startsWith("data:image")
    ) {

        return value;
    }


    /* =====================================================
       FULL URL
    ===================================================== */

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("//")
    ) {

        return value;
    }


    /* =====================================================
       API BASE URL
    ===================================================== */

    if (
        typeof api !== "undefined" &&
        api
    ) {

        const base =
            String(api)
                .replace(/\/$/, "");


        if (
            value.startsWith("/")
        ) {

            return (
                base +
                value
            );
        }


        return (
            base +
            "/" +
            value
        );
    }


    return value;
}


/* =========================================================
   RENDER STAGE ANNOUNCEMENT
========================================================= */

function renderStageAnnouncement(
    announcement
) {

    if (
        !els.stageAnnouncementModal
    ) {

        console.warn(
            "stageAnnouncementModal not found."
        );

        return;
    }


    /* =====================================================
       DATA
    ===================================================== */

    const rawImage =
        getAnnouncementImage(
            announcement
        );


    const image =
        buildImageUrl(
            rawImage
        );


    const stage =
        getAnnouncementStage(
            announcement
        );


    const normalizedStage =
        normalizeStageName(
            stage
        );


    console.log(
        "Rendering Announcement:",
        {
            stage,
            rawImage,
            image
        }
    );


    /* =====================================================
       IMAGE
    ===================================================== */

    if (
        image &&
        els.stageAnnouncementImage
    ) {

        els.stageAnnouncementImage.src =
            image;


        els.stageAnnouncementImage.alt =
            `إعلان المرحلة ${normalizedStage || ""}`;


        els.stageAnnouncementImage.classList.remove(
            "d-none"
        );


        if (
            els.stageAnnouncementFallback
        ) {

            els.stageAnnouncementFallback.classList.add(
                "d-none"
            );
        }


        els.stageAnnouncementImage.onerror =
            function () {

                console.warn(
                    "Announcement image failed:",
                    image
                );


                els.stageAnnouncementImage.classList.add(
                    "d-none"
                );


                if (
                    els.stageAnnouncementFallback
                ) {

                    els.stageAnnouncementFallback.classList.remove(
                        "d-none"
                    );
                }
            };

    } else {

        if (
            els.stageAnnouncementImage
        ) {

            els.stageAnnouncementImage.classList.add(
                "d-none"
            );
        }


        if (
            els.stageAnnouncementFallback
        ) {

            els.stageAnnouncementFallback.classList.remove(
                "d-none"
            );
        }
    }


    /* =====================================================
       TITLE
    ===================================================== */

    if (
        els.stageAnnouncementTitle
    ) {

        els.stageAnnouncementTitle.textContent =
            "إعلان هام";
    }


    /* =====================================================
       BADGE
    ===================================================== */

    if (
        els.stageAnnouncementBadge
    ) {

        els.stageAnnouncementBadge.textContent =
            `إعلان ${normalizedStage || "هام"}`;
    }


    /* =====================================================
       SUBTITLE
    ===================================================== */

    if (
        els.stageAnnouncementSubtitle
    ) {

        els.stageAnnouncementSubtitle.textContent =
            "إليك أحدث الإعلانات الخاصة بمرحلتك الدراسية";
    }


    /* =====================================================
       FOOTER
    ===================================================== */

    if (
        els.stageAnnouncementFooterText
    ) {

        els.stageAnnouncementFooterText.textContent =
            "نتمنى لك تجربة تعليمية مميزة";
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    if (
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                els.stageAnnouncementModal
            );


        modal.show();

    } else {

        console.warn(
            "Bootstrap JS is not loaded."
        );
    }
}


/* =========================================================
   SKELETON CARDS
========================================================= */

function renderSkeletonCards() {

    if (!els.skeletonGrid) {
        return;
    }


    const fragment =
        document.createDocumentFragment();


    for (
        let i = 0;
        i < SKELETON_CARD_COUNT;
        i++
    ) {

        fragment.appendChild(
            buildSkeletonCard()
        );
    }


    els.skeletonGrid.innerHTML = "";


    els.skeletonGrid.appendChild(
        fragment
    );
}


function buildSkeletonCard() {

    const col =
        document.createElement("div");


    col.className =
        "col-lg-4 col-md-6 col-12";


    const card =
        document.createElement("div");


    card.className =
        "gc skeleton-card";


    card.setAttribute(
        "aria-hidden",
        "true"
    );


    const banner =
        document.createElement("div");


    banner.className =
        "skeleton-shape skeleton-banner";


    const body =
        document.createElement("div");


    body.className =
        "skeleton-body";


    const line =
        document.createElement("div");


    line.className =
        "skeleton-shape skeleton-line";


    const btn =
        document.createElement("div");


    btn.className =
        "skeleton-shape skeleton-btn";


    body.appendChild(line);

    body.appendChild(btn);


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


    const fragment =
        document.createDocumentFragment();


    years.forEach(function (year) {

        fragment.appendChild(
            buildYearCard(year)
        );
    });


    els.yearsGrid.innerHTML = "";


    els.yearsGrid.appendChild(
        fragment
    );
}


/* =========================================================
   BUILD YEAR CARD
========================================================= */

function buildYearCard(year) {

    const col =
        document.createElement("div");


    col.className =
        "col-lg-4 col-md-6 col-12";


    col.setAttribute(
        "role",
        "listitem"
    );


    const card =
        document.createElement("div");


    card.className =
        "gc year-card";


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        "فتح المواد " +
        (year.yearName || "")
    );


    /* =====================================================
       BAR
    ===================================================== */

    const bar =
        document.createElement("div");


    bar.className =
        "gc-bar";


    /* =====================================================
       IMAGE
    ===================================================== */

    const media =
        buildYearMedia(year);


    /* =====================================================
       BODY
    ===================================================== */

    const body =
        document.createElement("div");


    body.className =
        "year-body";


    /* =====================================================
       YEAR NAME
    ===================================================== */

    const name =
        document.createElement("h3");


    name.className =
        "year-name";


    name.textContent =
        year.yearName ||
        "عام دراسي";


    /* =====================================================
       BUTTON
    ===================================================== */

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "year-btn";


    button.innerHTML = `
        فتح المواد
        <i
            class="bi bi-arrow-left"
            aria-hidden="true">
        </i>
    `;


    /* =====================================================
       OPEN YEAR
    ===================================================== */

    const handleOpen =
        function (event) {

            event.stopPropagation();

            openYear(
                year.yearId
            );
        };


    card.addEventListener(
        "click",
        function () {

            openYear(
                year.yearId
            );
        }
    );


    card.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openYear(
                    year.yearId
                );
            }
        }
    );


    button.addEventListener(
        "click",
        handleOpen
    );


    /* =====================================================
       APPEND
    ===================================================== */

    body.appendChild(name);

    body.appendChild(button);


    card.appendChild(bar);

    card.appendChild(media);

    card.appendChild(body);


    col.appendChild(card);


    return col;
}


/* =========================================================
   YEAR MEDIA
========================================================= */

function buildYearMedia(year) {

    const media =
        document.createElement("div");

    media.className =
        "year-media";

    media.setAttribute(
        "aria-hidden",
        "true"
    );

    const rawImage =
        getYearImage(year);

    const imageUrl =
        buildYearImageUrl(rawImage);

    console.log(
        "Year Image:",
        {
            year,
            rawImage,
            imageUrl
        }
    );

    if (imageUrl) {

        const img =
            document.createElement("img");

        img.className =
            "year-img";

        img.src =
            imageUrl;

        img.alt =
            year?.yearName ||
            "عام دراسي";

        img.loading =
            "eager";

        img.decoding =
            "async";

        /*
            مهم جدًا:
            لا تستخدم no-referrer هنا.
            الـ CDN ممكن يكون محتاج Referer.
        */

        img.addEventListener(
            "load",
            function () {

                console.log(
                    "Year image loaded successfully:",
                    imageUrl
                );

            },
            {
                once: true
            }
        );

        img.addEventListener(
            "error",
            function () {

                console.error(
                    "Year image failed to load:",
                    imageUrl
                );

                media.innerHTML =
                    buildFallbackIconMarkup();

            },
            {
                once: true
            }
        );

        media.appendChild(img);

    } else {

        media.innerHTML =
            buildFallbackIconMarkup();
    }

    return media;
}


/* =========================================================
   GET YEAR IMAGE
========================================================= */

function getYearImage(year) {

    if (!year) {
        return "";
    }


    /*
        كل الـ properties المحتملة
        للصورة.
    */

    const keys = [

        "imgLink",
        "ImgLink",

        "image",
        "Image",

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

        "photo",
        "Photo",

        "photoUrl",
        "PhotoUrl"
    ];


    for (const key of keys) {

        if (
            year[key] !== undefined &&
            year[key] !== null &&
            String(
                year[key]
            ).trim() !== ""
        ) {

            return String(
                year[key]
            ).trim();
        }
    }


    /*
        لو الصورة جوا object
    */

    const nestedObjects = [
        year.image,
        year.Image,
        year.media,
        year.Media,
        year.photo,
        year.Photo
    ];


    for (
        const object
        of nestedObjects
    ) {

        if (
            object &&
            typeof object === "object"
        ) {

            for (const key of keys) {

                if (
                    object[key] !== undefined &&
                    object[key] !== null &&
                    String(
                        object[key]
                    ).trim() !== ""
                ) {

                    return String(
                        object[key]
                    ).trim();
                }
            }
        }
    }


    return "";
}


/* =========================================================
   BUILD YEAR IMAGE URL
========================================================= */

function buildYearImageUrl(image) {

    if (!image) {
        return "";
    }


    let value =
        String(image).trim();


    if (!value) {
        return "";
    }


    /* =====================================================
       BASE64
    ===================================================== */

    if (
        value.startsWith(
            "data:image"
        )
    ) {

        return value;
    }


    /* =====================================================
       FULL URL
    ===================================================== */

    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        ) ||
        value.startsWith("//")
    ) {

        return value;
    }


    /* =====================================================
       CLEAN PATH
    ===================================================== */

    value =
        value
            .replace(
                /^\.\//,
                ""
            )
            .replace(
                /^\//,
                ""
            );


    /* =====================================================
       YEARS IMAGES PATH
    ===================================================== */

    if (
        value
            .toLowerCase()
            .startsWith(
                "yearsimgs/"
            )
    ) {

        return (
            CDN_BASE_URL +
            "/" +
            value
        );
    }


    /*
        لو الـ API بيرجع
        اسم الصورة فقط
    */

    return (
        CDN_BASE_URL +
        "/YearsImgs/" +
        value
    );
}


/* =========================================================
   FALLBACK ICON
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

    if (!yearId) {

        console.error(
            "Invalid Year ID"
        );

        return;
    }


    /*
        نرسل ID السنة + المرحلة (level) الحالية
        إلى صفحة المواد، عشان لو الطالب رجع من صفحة
        المواد لصفحة الأعوام، يرجع لنفس المرحلة اللي
        كان فيها بالظبط.
    */

    let url =
        "subject.html?" +
        "yearId=" +
        encodeURIComponent(
            yearId
        );

    if (
        [1, 2, 3].includes(level)
    ) {

        url +=
            "&level=" +
            encodeURIComponent(
                level
            );
    }

    window.location.href =
        url;
}