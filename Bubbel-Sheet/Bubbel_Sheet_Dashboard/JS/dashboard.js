"use strict";

/* ==========================================================================
MASTER DASHBOARD
API:
GET /Dashboard/get-Admin-data

Response:
{
countOfStudent: 17,
years: [],
imgAds: []
}

IMPORTANT:
- Token is NOT stored in localStorage.
- refreshToken() comes from auth.js.
- Master profile is static.
========================================================================== */

/* ==========================================================================
STATIC MASTER PROFILE
========================================================================== */

const STATIC_MASTER_PROFILE = {
name: "مستر أحمد بكر",

phone: "01064557990",

email: "ahmedbakrmmiftah93@gmail.com",
};

/* ==========================================================================
DASHBOARD STATE
========================================================================== */

let dashboardData = {
countOfStudent: 0,

years: [],

imgAds: [],
};

let academicYears = [];

let announcements = [];

let subjects = [];

let pendingDelete = null;

/* ==========================================================================
API SERVICE
========================================================================== */

const MasterAPIService = {
async getDashboardData() {
let response = await apiRequest(
    "/Dashboard/get-Admin-data",

    {
    method: "GET",
    },
);

/*
    * Access token expired.
    * Try refresh and request again.
    */

if (response.status === 401) {
    const refreshed = await refreshToken();

    if (!refreshed) {
    throw new Error("UNAUTHORIZED");
    }

    response = await apiRequest(
    "/Dashboard/get-Admin-data",

    {
        method: "GET",
    },
    );
}

if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
}

if (response.status === 403) {
    throw new Error("FORBIDDEN");
}

if (!response.ok) {
    console.error("Admin API Error:", response.status);

    throw new Error("SERVER_ERROR");
}

return await response.json();
},
};
function getLevelEnumValue(stage) {

    switch (stage) {

        case "ابتدائي":
            return "1";

        case "إعدادي":
            return "2";

        case "ثانوي":
            return "3";

        default:
            return "";
    }
}
/* ==========================================================================
ANNOUNCEMENT API SERVICE
========================================================================== */

const AnnouncementAPIService = {

    async addAnnouncement(formData) {

        const endpoint = "/Ad/add-imgad";

        let response = await apiRequest(
            endpoint,
            {
                method: "POST",
                body: formData
            }
        );


        if (response.status === 401) {

            const refreshed = await refreshToken();

            if (!refreshed) {
                throw new Error("UNAUTHORIZED");
            }

            response = await apiRequest(
                endpoint,
                {
                    method: "POST",
                    body: formData
                }
            );
        }


        if (response.status === 401) {
            throw new Error("UNAUTHORIZED");
        }

        if (response.status === 403) {
            throw new Error("FORBIDDEN");
        }

        if (!response.ok) {
            console.error(
                "Add Announcement Error:",
                response.status
            );

            throw new Error("SERVER_ERROR");
        }

        return await response.json();
    },


    async deleteAnnouncement(id) {

        const endpoint =
            `/Ad/Delete-imgad?id=${encodeURIComponent(id)}`;

        let response = await apiRequest(
            endpoint,
            {
                method: "DELETE"
            }
        );


        if (response.status === 401) {

            const refreshed = await refreshToken();

            if (!refreshed) {
                throw new Error("UNAUTHORIZED");
            }

            response = await apiRequest(
                endpoint,
                {
                    method: "DELETE"
                }
            );
        }


        if (response.status === 401) {
            throw new Error("UNAUTHORIZED");
        }

        if (response.status === 403) {
            throw new Error("FORBIDDEN");
        }

        if (!response.ok) {
            console.error(
                "Delete Announcement Error:",
                response.status
            );

            throw new Error("SERVER_ERROR");
        }

        return true;
    }

};

/* ==========================================================================
PARTICLES
========================================================================== */

(function initParticles() {
const container = document.getElementById("ptc");

if (!container) {
return;
}

for (let i = 0; i < 30; i++) {
const particle = document.createElement("div");

particle.className = "pt";

const size = Math.random() * 5 + 2;

particle.style.cssText = `

    width:${size}px;
    height:${size}px;
    left:${Math.random() * 100}vw;
    bottom:-8px;
    animation-duration:${Math.random() * 22 + 12}s;
    animation-delay:${Math.random() * 20}s;

`;

container.appendChild(particle);
}
})();

/* ==========================================================================
SCROLL REVEAL
========================================================================== */

(function initScrollReveal() {
const elements = document.querySelectorAll("[data-r]");

if (!("IntersectionObserver" in window)) {
elements.forEach((element) => {
    element.classList.add("vis");
});

return;
}

const observer = new IntersectionObserver(
(entries) => {
    entries.forEach((entry) => {
    if (entry.isIntersecting) {
        entry.target.classList.add("vis");

        observer.unobserve(entry.target);
    }
    });
},

{
    threshold: 0.1,

    rootMargin: "0px 0px -30px 0px",
},
);

elements.forEach((element) => {
observer.observe(element);
});

/*
* Support data-d elements.
*/

document.querySelectorAll("[data-d]").forEach((element) => {
if (!element.hasAttribute("data-r")) {
    element.setAttribute("data-r", "up");

    observer.observe(element);
}
});
})();

/* ==========================================================================
COUNTERS
========================================================================== */

function animateCounter(element, target) {
if (!element) {
return;
}

target = Number(target) || 0;

const duration = 1600;

const startValue = 0;

const startTime = performance.now();

function easeOut(t) {
return 1 - Math.pow(1 - t, 4);
}

function tick(now) {
const progress = Math.min((now - startTime) / duration, 1);

const value = Math.round(
    startValue + (target - startValue) * easeOut(progress),
);

element.textContent = value.toLocaleString("ar-EG");

if (progress < 1) {
    requestAnimationFrame(tick);
}
}

requestAnimationFrame(tick);
}

/* ==========================================================================
UPDATE STUDENT COUNT
========================================================================== */

function updateStudentCount(count) {
const studentCounter = document.getElementById("studentCount");

if (!studentCounter) {
console.warn("studentCount element not found.");

return;
}

const numericCount = Number(count) || 0;



/*
* Save value in dataset.
*/

studentCounter.dataset.count = numericCount;

/*
* IMPORTANT:
* The old IntersectionObserver could already have
* unobserved the counter while its value was 0.
*
* So we directly animate it here after API response.
*/

animateCounter(studentCounter, numericCount);
}

/* ==========================================================================
STATIC MASTER PROFILE
========================================================================== */

function loadStaticProfile() {
const profile = STATIC_MASTER_PROFILE;

const masterName = document.getElementById("masterName");

const welcomeName = document.getElementById("welcomeName");

const navbarMasterName = document.getElementById("navbarMasterName");

const mobileWelcomeName = document.getElementById("mobilewelcomeName");

const masterPhone = document.getElementById("masterPhone");

const masterEmail = document.getElementById("masterEmail");

if (masterName) {
masterName.textContent = profile.name;
}

if (welcomeName) {
welcomeName.textContent = profile.name;
}

if (navbarMasterName) {
navbarMasterName.textContent = profile.name;
}

if (mobileWelcomeName) {
mobileWelcomeName.textContent = profile.name;
}

if (masterPhone) {
masterPhone.textContent = profile.phone;
}

if (masterEmail) {
masterEmail.textContent = profile.email;
}

const firstLetter = profile.name.trim().charAt(0) || "م";

const avatars = [
"welcomeAvatarInitial",

"masterAvatarInitial",

"masterAvatarMobile",
];

avatars.forEach((id) => {
const element = document.getElementById(id);

if (element) {
    element.textContent = firstLetter;
}
});
}

/* ==========================================================================
LAST LOGIN
========================================================================== */

function setLastLogin() {
const element = document.getElementById("lastLoginText");

if (!element) {
return;
}

const now = new Date();

element.textContent = `آخر تسجيل دخول ${now.toLocaleDateString("ar-EG")} ${now.toLocaleTimeString("ar-EG")}`;
}

/* ==========================================================================
NORMALIZE API RESPONSE
========================================================================== */

function normalizeDashboardData(data) {
if (!data) {
return {
    countOfStudent: 0,

    years: [],

    imgAds: [],
};
}

/*
* API response is directly:
*
* {
*     countOfStudent: 17,
*     years: [],
*     imgAds: []
* }
*/

const root = data.data || data.result || data;

return {
countOfStudent: Number(
    root.countOfStudent ??
    root.CountOfStudent ??
    root.studentsCount ??
    root.StudentsCount ??
    root.numberOfStudents ??
    root.NumberOfStudents ??
    0,
),

years: Array.isArray(root.years)
    ? root.years
    : Array.isArray(root.Years)
    ? root.Years
    : [],

imgAds: Array.isArray(root.imgAds)
    ? root.imgAds
    : Array.isArray(root.ImgAds)
    ? root.ImgAds
    : Array.isArray(root.imageAds)
        ? root.imageAds
        : [],
};
}

/* ==========================================================================
APPLY DASHBOARD DATA
========================================================================== */

function applyDashboardData(data) {
dashboardData = normalizeDashboardData(data);


/*
* Save years.
*/

academicYears = dashboardData.years || [];

/*
* Save advertisements.
*/

announcements = dashboardData.imgAds || [];

/*
* Update student count.
*/

updateStudentCount(dashboardData.countOfStudent);

/*
* Update subject grades.
*/

populateGradeOptions(document.getElementById("subjectStage")?.value || "");

/*
* Render advertisements.
*/

renderAnnouncements();
}

/* ==========================================================================
LOAD ADMIN DASHBOARD
========================================================================== */

async function getDashboardData() {
console.log("Loading Admin Dashboard...");

const data = await MasterAPIService.getDashboardData();

console.log("Admin Dashboard Response:", data);

return data;
}

/* ==========================================================================
LOAD MASTER DASHBOARD
========================================================================== */

async function loadMasterDashboard() {
try {
console.log("Loading Admin Dashboard...");

/*
    * Static master profile.
    */

loadStaticProfile();

/*
    * Last login.
    */

setLastLogin();

/*
    * Make sure we have a valid access token.
    */

if (typeof accessToken === "undefined" || !accessToken) {
    const refreshed = await refreshToken();

    if (!refreshed) {
    window.location.href = "login.html";

    return;
    }
}

/*
    * Get API data.
    */

const data = await getDashboardData();

/*
    * Apply API data.
    */

applyDashboardData(data);

console.log("Admin Dashboard loaded successfully.");
} catch (error) {
console.error("Failed to load Admin Dashboard:", error);

if (error.message === "UNAUTHORIZED") {
    window.location.href = "login.html";

    return;
}

if (error.message === "FORBIDDEN") {
    showToast("error", "ليس لديك صلاحية للدخول إلى لوحة التحكم.");

    return;
}

showToast("error", "تعذر تحميل بيانات لوحة التحكم.");
}
}

/* ==========================================================================
GO TO ACADEMIC YEARS
========================================================================== */

function goToAcademicYears(level) {
if (!level) {
return;
}

/*
* Arabic stage names are sent directly.
*/

const validLevels = ["ابتدائي", "إعدادي", "ثانوي"];

if (!validLevels.includes(String(level))) {
console.error("Invalid academic level:", level);

return;
}

window.location.href = `years.html?level=${encodeURIComponent(level)}`;
}

/* ==========================================================================
FIELD VALIDATION
========================================================================== */

function setFieldError(inputElement, show) {
if (!inputElement) {
return;
}

inputElement.classList.toggle("is-invalid", show);

const errorElement = document.querySelector(
`.field-error[data-for="${inputElement.id}"]`,
);

if (errorElement) {
errorElement.classList.toggle("show", show);
}
}

/* ==========================================================================
TOAST
========================================================================== */

function showToast(type, message) {
const stack = document.getElementById("toastStack");

if (!stack) {
return;
}

const icon = type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill";

const toast = document.createElement("div");

toast.className = `m-toast ${type}`;

toast.innerHTML = `

<i class="bi ${icon}"></i>

<span>
    ${escapeHtml(message)}
</span>

`;

stack.appendChild(toast);

setTimeout(() => {
toast.style.opacity = "0";

toast.style.transform = "translateY(10px)";

toast.style.transition = ".3s ease";

setTimeout(() => {
    toast.remove();
}, 300);
}, 3200);
}

/* ==========================================================================
CONFIRM DELETE
========================================================================== */

function bindConfirmModal() {
const overlay = document.getElementById("confirmOverlay");

const cancel = document.getElementById("confirmCancel");

const deleteButton = document.getElementById("confirmDelete");

if (!overlay || !cancel || !deleteButton) {
return;
}

cancel.addEventListener("click", () => {
overlay.classList.remove("show");

pendingDelete = null;
});

deleteButton.addEventListener("click", async () => {
if (!pendingDelete) {
    return;
}

const { type, id } = pendingDelete;

try {
    await performDelete(type, id);
} catch (error) {
    console.error("Delete error:", error);

    showToast("error", "حدث خطأ أثناء الحذف.");
}

overlay.classList.remove("show");

pendingDelete = null;
});
}

/* ==========================================================================
ASK DELETE CONFIRM
========================================================================== */

function askDeleteConfirm(type, id) {
pendingDelete = {
type,

id,
};

const overlay = document.getElementById("confirmOverlay");

if (overlay) {
overlay.classList.add("show");
}
}

/* ==========================================================================
DELETE
========================================================================== */

async function performDelete(type, id) {

    if (type !== "announcement") {
        return;
    }


    try {

        await AnnouncementAPIService.deleteAnnouncement(id);


        /*
         * Delete from local state ONLY
         * after API succeeds.
         */
        announcements = announcements.filter(
            (item, index) => {

                const itemId =
                    getAnnouncementId(item, index);

                return String(itemId) !==
                    String(id);
            }
        );


        /*
         * Refresh UI
         */
        renderAnnouncements();


        showToast(
            "success",
            "تم حذف الإعلان بنجاح."
        );


    } catch (error) {

        console.error(
            "Delete Announcement Error:",
            error
        );


        if (error.message === "UNAUTHORIZED") {

            window.location.href =
                "login.html";

            return;
        }


        if (error.message === "FORBIDDEN") {

            showToast(
                "error",
                "ليس لديك صلاحية لحذف الإعلان."
            );

            return;
        }


        showToast(
            "error",
            "حدث خطأ أثناء حذف الإعلان."
        );

        throw error;
    }
}

/* ==========================================================================
GENERIC OBJECT VALUE
========================================================================== */

function getObjectValue(object, keys) {
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

/* ==========================================================================
NORMALIZE STAGE NAME
========================================================================== */

function normalizeStageName(stage) {
if (stage === null || stage === undefined) {
return "";
}

const value = String(stage).trim();

/*
* Already Arabic.
*/

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

/*
* If API returns numeric stage.
*/

if (value === "1") {
return "ابتدائي";
}

if (value === "2") {
return "إعدادي";
}

if (value === "3") {
return "ثانوي";
}

/*
* If API returns enum-like values.
*/

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

/* ==========================================================================
STAGE BADGE CLASS
========================================================================== */

function stageBadgeClass(stage) {
const normalized = normalizeStageName(stage);

if (normalized === "ابتدائي") {
return "badge-primary";
}

if (normalized === "إعدادي") {
return "badge-prep";
}

if (normalized === "ثانوي") {
return "badge-secondary";
}

return "badge-secondary";
}

/* ==========================================================================
STAGE ICON
========================================================================== */

function stageIconClass(stage) {
const normalized = normalizeStageName(stage);

if (normalized === "ابتدائي") {
return "bi-flower1";
}

if (normalized === "إعدادي") {
return "bi-journal-bookmark-fill";
}

return "bi-mortarboard-fill";
}

/* ==========================================================================
GENERATE LOCAL ID
========================================================================== */

function genId(prefix) {
return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/* ==========================================================================
READ IMAGE
========================================================================== */

function readImageAsDataUrl(fileInput, callback) {
const file = fileInput.files && fileInput.files[0];

if (!file) {
callback(null);

return;
}

const reader = new FileReader();

reader.onload = (event) => callback(event.target.result);

reader.readAsDataURL(file);
}

/* ==========================================================================
ACADEMIC YEARS FORM
========================================================================== */

function bindYearForm() {
const form = document.getElementById("yearForm");

const uploadBox = document.getElementById("yearUploadBox");

const fileInput = document.getElementById("yearImage");

const preview = document.getElementById("yearPreview");

const previewImg = document.getElementById("yearPreviewImg");

const removeButton = document.getElementById("yearRemoveImg");

if (!form || !fileInput) {
return;
}

if (uploadBox) {
uploadBox.addEventListener("click", () => fileInput.click());
}

fileInput.addEventListener("change", () => {
readImageAsDataUrl(fileInput, (dataUrl) => {
    if (!dataUrl) {
    return;
    }

    if (previewImg) {
    previewImg.src = dataUrl;
    }

    if (preview) {
    preview.classList.add("show");
    }
});
});

if (removeButton) {
removeButton.addEventListener("click", () => {
    fileInput.value = "";

    if (preview) {
    preview.classList.remove("show");
    }
});
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const stageEl = document.getElementById("yearStage");
    const nameEl = document.getElementById("yearName");

    const stageValid = !!stageEl?.value;
    const nameValid = !!nameEl && nameEl.value.trim().length > 0;

    setFieldError(stageEl, !stageValid);
    setFieldError(nameEl, !nameValid);

    if (!stageValid || !nameValid) {
        return;
    }

    const formData = new FormData();

    formData.append("Level", stageEl.value);
    formData.append("YearName", nameEl.value.trim());

    if (fileInput.files.length > 0) {
        formData.append("Img", fileInput.files[0]);
    }

    try {
        const response = await apiRequest("/Year/add-year", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to add academic year.");
        }

        const result = await response.json();

        showToast("success", "تم إضافة السنة الدراسية بنجاح.");

        form.reset();

        if (preview) {
            preview.classList.remove("show");
        }

        populateGradeOptions("");

    } catch (error) {
        console.error(error);

        showToast("error", "حدث خطأ أثناء إضافة السنة الدراسية.");
    }
});
}

/* ==========================================================================
SUBJECT FORM
========================================================================== */

function bindSubjectForm() {
const form = document.getElementById("subjectForm");

const stageEl = document.getElementById("subjectStage");

const gradeEl = document.getElementById("subjectGrade");

if (!form || !stageEl || !gradeEl) {
return;
}

stageEl.addEventListener("change", () => {
populateGradeOptions(stageEl.value);
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameEl = document.getElementById("subjectName");
    const priceEl = document.getElementById("subjectPrice");
    const descriptionEl = document.getElementById("subjectDescription");

    const stageValid = !!stageEl.value;
    const gradeValid = !!gradeEl.value;
    const nameValid = nameEl.value.trim().length > 0;
    const priceValid = priceEl.value.trim().length > 0 && !isNaN(Number(priceEl.value));

    setFieldError(stageEl, !stageValid);
    setFieldError(gradeEl, !gradeValid);
    setFieldError(nameEl, !nameValid);
    setFieldError(priceEl, !priceValid);

    if (!stageValid || !gradeValid || !nameValid || !priceValid) {
        return;
    }

   const formData = new FormData();


formData.append("YearId", gradeEl.value);
formData.append("Name", nameEl.value.trim());
formData.append("Description", descriptionEl.value.trim());
formData.append("Price", priceEl.value);

    try {
        const response = await apiRequest("/Subject/add-subject", {
    method: "POST",
    body: formData
        });

        if (!response.ok) {
            throw new Error("فشل في إضافة المادة");
        }

        const result = await response.json();
        console.log(result);
        subjects.push({
            id: result.yearId,

            stage: stageEl.value,

            grade: gradeEl.value,

            name: nameEl.value.trim(),

            price: Number(priceEl.value),

            description: descriptionEl.value.trim(),
        });

        showToast("success", "تم إضافة المادة في الواجهة.");

        form.reset();

        // populateGradeOptions("");

    } catch (error) {
        console.error(error);
        showToast("error", "حدث خطأ أثناء إضافة السنة.");
    }
});
}

/* ==========================================================================
GET YEAR STAGE
========================================================================== */

function getYearStage(year) {
return getObjectValue(
year,

["stage", "Stage", "level", "Level", "academicStage", "AcademicStage"],
);
}

/* ==========================================================================
GET YEAR NAME
========================================================================== */

function getYearName(year) {
return getObjectValue(
year,

[
    "name",
    "Name",
    "yearName",
    "YearName",
    "academicYearName",
    "AcademicYearName",
    "gradeName",
    "GradeName",
],
);
}

/* ==========================================================================
POPULATE GRADES
========================================================================== */
async function loadAcademicYears(level) {
    try {
        console.log("Sending level:", level);

        const response = await apiRequest(
            `/Dashboard/get-years?level=${encodeURIComponent(level)}`,
            {
                method: "GET"
            }
        );

        console.log("GetYears status:", response.status);

        const responseText = await response.text();

        console.log("GetYears response:", responseText);

        if (!response.ok) {
            throw new Error(`GetYears failed: ${response.status}`);
        }

        const result = JSON.parse(responseText);

        academicYears = result;

        console.log("academicYears:", academicYears);

    } catch (error) {
        console.error("GetYears Error:", error);
    }
}
async function populateGradeOptions(stage) {
    const gradeEl = document.getElementById("subjectGrade");

    if (!gradeEl) {
        return;
    }

    if (!stage) {
        gradeEl.innerHTML = `
            <option value="" disabled selected>
                اختر المرحلة أولاً
            </option>
        `;

        gradeEl.disabled = true;

        return;
    }

    await loadAcademicYears(stage);

   const matching = academicYears;

    if (matching.length === 0) {
        gradeEl.innerHTML = `
            <option value="" disabled selected>
                لا توجد صفوف مضافة لهذه المرحلة
            </option>
        `;

        gradeEl.disabled = true;

        return;
    }

    gradeEl.disabled = false;

    gradeEl.innerHTML = `
        <option value="" disabled selected>
            اختر الصف الدراسي
        </option>
    `;

    matching.forEach((year) => {
    const name = getYearName(year);

    if (!name) {
        return;
    }

    const option = document.createElement("option");

    option.value = year.id ?? year.Id ?? year.yearId ?? year.YearId;
    option.textContent = name;

    gradeEl.appendChild(option);
});
}

/* ==========================================================================
ANNOUNCEMENT FORM
========================================================================== */

function bindAnnouncementForm() {

    const form = document.getElementById("announcementForm");

    const fileInput = document.getElementById("annImage");

    const uploadBox = document.getElementById("annUploadBox");

    const preview = document.getElementById("annPreview");

    const previewImg = document.getElementById("annPreviewImg");

    const removeButton = document.getElementById("annRemoveImg");


    if (!form || !fileInput) {
        return;
    }


    let currentImage = null;


    if (uploadBox) {
        uploadBox.addEventListener(
            "click",
            () => fileInput.click()
        );
    }


    fileInput.addEventListener("change", () => {

        readImageAsDataUrl(
            fileInput,
            (dataUrl) => {

                currentImage = dataUrl;

                if (dataUrl && previewImg && preview) {

                    previewImg.src = dataUrl;

                    preview.classList.add("show");

                    setFieldError(
                        fileInput,
                        false
                    );
                }
            }
        );
    });


    if (removeButton) {

        removeButton.addEventListener(
            "click",
            () => {

                fileInput.value = "";

                currentImage = null;

                if (preview) {
                    preview.classList.remove("show");
                }
            }
        );
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const stageEl =
                document.getElementById("annStage");


            const stageValid =
                !!stageEl?.value;


            const imageValid =
                !!fileInput.files?.length;


            setFieldError(
                stageEl,
                !stageValid
            );

            setFieldError(
                fileInput,
                !imageValid
            );


            if (!stageValid || !imageValid) {
                return;
            }


            /*
             * Convert Arabic stage
             * to Levels enum value.
             */
            const level =
                getLevelEnumValue(stageEl.value);


            if (!level) {

                showToast(
                    "error",
                    "المرحلة الدراسية غير صحيحة."
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "Level",
                level
            );


            formData.append(
                "Img",
                fileInput.files[0]
            );


            /*
             * Debug
             */
            console.log(
                "Level:",
                level
            );

            console.log(
                "Image:",
                fileInput.files[0]
            );


            try {

                const response =
                    await AnnouncementAPIService
                        .addAnnouncement(
                            formData
                        );


                console.log(
                    "Add Announcement Response:",
                    response
                );


                /*
                 * API returns ImgAdDTO
                 */
                const newAnnouncement =
                    response.data ||
                    response.result ||
                    response;


                announcements.push(
                    newAnnouncement
                );


                renderAnnouncements();


                showToast(
                    "success",
                    "تم إضافة الإعلان بنجاح."
                );


                form.reset();

                currentImage = null;


                if (preview) {
                    preview.classList.remove(
                        "show"
                    );
                }

            } catch (error) {

                console.error(
                    "Add Announcement Error:",
                    error
                );


                if (
                    error.message ===
                    "UNAUTHORIZED"
                ) {

                    window.location.href =
                        "login.html";

                    return;
                }


                if (
                    error.message ===
                    "FORBIDDEN"
                ) {

                    showToast(
                        "error",
                        "ليس لديك صلاحية لإضافة إعلان."
                    );

                    return;
                }


                showToast(
                    "error",
                    "حدث خطأ أثناء إضافة الإعلان."
                );
            }
        }
    );
}

/* ==========================================================================
GET ANNOUNCEMENT IMAGE
========================================================================== */

function getAnnouncementImage(announcement) {
    return getObjectValue(
        announcement,
        [
            "image", "Image",
            "imgLink", "ImgLink",     
            "imageUrl", "ImageUrl",
            "imageURL", "ImageURL",
            "img", "Img",
            "imgUrl", "ImgUrl",
            "imgURL", "ImgURL",
            "url", "Url",
            "path", "Path",
            "filePath", "FilePath",
            "fileUrl", "FileUrl",
            "imagePath", "ImagePath",
        ],
    );
}

/* ==========================================================================
GET ANNOUNCEMENT STAGE
========================================================================== */

function getAnnouncementStage(announcement) {
const stage = getObjectValue(
announcement,

[
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
],
);

return normalizeStageName(stage);
}

/* ==========================================================================
GET ANNOUNCEMENT ID
========================================================================== */

function getAnnouncementId(announcement, index) {
return (
getObjectValue(
    announcement,

    [
    "id",
    "Id",

    "imageAdId",
    "ImageAdId",

    "imgAdId",
    "ImgAdId",

    "advertisementId",
    "AdvertisementId",
    ],
) || `api-ad-${index}`
);
}

/* ==========================================================================
BUILD IMAGE URL
========================================================================== */

function buildImageUrl(image) {
if (!image) {
return "";
}

const value = String(image).trim();

if (!value) {
return "";
}

/*
* Base64 image.
*/

if (value.startsWith("data:image")) {
return value;
}

/*
* Full URL.
*/

if (
value.startsWith("http://") ||
value.startsWith("https://") ||
value.startsWith("//")
) {
return value;
}

/*
* Relative URL.
*
* If your API returns something like:
* /uploads/ads/test.jpg
*
* api is used as the base.
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

/* ==========================================================================
RENDER ANNOUNCEMENTS
========================================================================== */

function renderAnnouncements() {
const grid = document.getElementById("announcementsGrid");

const empty = document.getElementById("announcementsEmpty");

if (!grid || !empty) {
return;
}

if (!announcements || announcements.length === 0) {
grid.innerHTML = "";

grid.style.display = "none";

empty.style.display = "block";

return;
}

grid.style.display = "grid";

empty.style.display = "none";

grid.innerHTML = announcements
.map((announcement, index) => {
    const id = getAnnouncementId(announcement, index);

    const stage = getAnnouncementStage(announcement);

    const rawImage = getAnnouncementImage(announcement);

    const image = buildImageUrl(rawImage);

    return `

                <div class="gc ann-card">

                    <div
                        class="gc-bar"
                        style="
                            background:
                            linear-gradient(
                                120deg,
                                var(--i),
                                var(--b)
                            );
                        ">
                    </div>


                    <button
                        type="button"
                        class="ann-card-img"
                        onclick="openImageLightbox('${escapeAttribute(image)}')"
                        title="عرض الصورة">


                        ${
                            image
                            ? `

                                    <img
                                        src="${escapeAttribute(image)}"
                                        alt="صورة الإعلان"
                                        onerror="
                                            this.style.display='none';
                                            this.parentElement.classList.add('image-error');
                                        "
                                    >

                                    `
                            : `

                                    <i class="bi bi-image"></i>

                                    `
                        }


                        <span class="ann-zoom-hint">

                            <i class="bi bi-zoom-in"></i>

                        </span>


                    </button>


                    <div
                        class="ann-card-footer"
                        style="
                            position:relative;
                            z-index:2;
                        ">


                        <span
                            class="
                                ann-stage-cell
                                ${stageBadgeClass(stage)}
                            ">


                            <i
                                class="
                                    bi
                                    ${stageIconClass(stage)}
                                ">
                            </i>


                            ${escapeHtml(stage || "غير محدد")}


                        </span>


                        <div
                            class="icon-btn delete"
                            onclick="
                                askDeleteConfirm(
                                    'announcement',
                                    '${escapeAttribute(String(id))}'
                                )
                            "
                            title="حذف">


                            <i class="bi bi-trash-fill"></i>


                        </div>


                    </div>


                </div>

            `;
})
.join("");
}

/* ==========================================================================
IMAGE LIGHTBOX
========================================================================== */

function bindImageLightbox() {
const overlay = document.getElementById("imgLightboxOverlay");

const closeButton = document.getElementById("imgLightboxClose");

if (!overlay || !closeButton) {
return;
}

closeButton.addEventListener("click", closeImageLightbox);

overlay.addEventListener("click", (event) => {
if (event.target === overlay) {
    closeImageLightbox();
}
});

document.addEventListener("keydown", (event) => {
if (event.key === "Escape") {
    closeImageLightbox();
}
});
}

/* ==========================================================================
OPEN LIGHTBOX
========================================================================== */

function openImageLightbox(src) {
if (!src) {
return;
}

const image = document.getElementById("imgLightboxImg");

const overlay = document.getElementById("imgLightboxOverlay");

if (!image || !overlay) {
return;
}

image.src = src;

overlay.classList.add("show");
}

/* ==========================================================================
CLOSE LIGHTBOX
========================================================================== */

function closeImageLightbox() {
const overlay = document.getElementById("imgLightboxOverlay");

if (overlay) {
overlay.classList.remove("show");
}
}

/* ==========================================================================
HTML ESCAPING
========================================================================== */

function escapeHtml(value) {
return String(value ?? "")
.replace(/&/g, "&amp;")

.replace(/</g, "&lt;")

.replace(/>/g, "&gt;")

.replace(/"/g, "&quot;")

.replace(/'/g, "&#039;");
}

/* ==========================================================================
ATTRIBUTE ESCAPING
========================================================================== */

function escapeAttribute(value) {
return escapeHtml(value).replace(/`/g, "&#096;");
}

/* ==========================================================================
INITIALIZATION
========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

/*
* Static profile.
*/

loadStaticProfile();

/*
* Last login.
*/

setLastLogin();

/*
* Forms.
*/

bindYearForm();

bindSubjectForm();

bindAnnouncementForm();

bindConfirmModal();

bindImageLightbox();

/*
* Initial UI.
*/

renderAnnouncements();

populateGradeOptions("");

/*
* Load API.
*/

await loadMasterDashboard();

});

/* ==========================================================================
GLOBAL FUNCTIONS
========================================================================== */

window.goToAcademicYears = goToAcademicYears;

window.openImageLightbox = openImageLightbox;

window.closeImageLightbox = closeImageLightbox;

window.askDeleteConfirm = askDeleteConfirm;

window.showToast = showToast;