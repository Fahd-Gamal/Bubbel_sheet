/* =====================================================
SUBJECTS PAGE — JS
Dynamic Subjects Loading

URL:
subject.html?yearId=5

API:
GET /api/Dashboard/get-subjects?YearId=5

Response:
[
    {
        "subjectId": 2,
        "name": "history",
        "description": "history discrip",
        "lessonCount": 1,
        "level": 1,
        "price": 2000
    }
]
===================================================== */


/* =========================
INIT
========================= */

document.addEventListener(
'DOMContentLoaded',
function () {

    initSubjectsPage();

}
);


/* =========================
CONFIG
========================= */

const SUBJECTS_API_URL =
'/Dashboard/get-subjects';

const SKELETON_ROW_COUNT = 6;


/* =========================
GET YEAR ID FROM URL
========================= */

const urlParams =
new URLSearchParams(
    window.location.search
);

const yearId =
Number(
    urlParams.get('yearId')
);


console.log(
'Selected Year ID:',
yearId
);


/* =========================
GO BACK TO THE SAME STAGE'S YEARS

years.html reads the stage from a "level" query param
(?level=1|2|3). We keep it around so the breadcrumb
"الأعوام الدراسية" link sends the student back to the exact
same stage's years list instead of a generic years.html
with no stage selected.
========================= */

const STAGE_ID_PARAM_NAMES =
[
    'level',
    'stageId',
    'stageID',
    'levelId',
    'levelID',
    'stage'
];


function getStageIdFromUrl() {

for (
    const paramName of STAGE_ID_PARAM_NAMES
) {

    const value =
        urlParams.get(
            paramName
        );


    if (
        value
    ) {

        return value;

    }

}


return null;

}


function resolveYearsBreadcrumbHref() {

/* =========================
    1) Stage id passed directly in THIS page's URL
========================= */

const stageIdFromUrl =
    getStageIdFromUrl();


if (
    stageIdFromUrl
) {

    sessionStorage.setItem(
        'lastLevel',
        stageIdFromUrl
    );


    return (
        'years.html?level=' +
        encodeURIComponent(
            stageIdFromUrl
        )
    );

}


/* =========================
    2) Stage id remembered from an earlier visit
    (e.g. student refreshed this page)
========================= */

const storedStageId =
    sessionStorage.getItem(
        'lastLevel'
    );


if (
    storedStageId
) {

    return (
        'years.html?level=' +
        encodeURIComponent(
            storedStageId
        )
    );

}


/* =========================
    3) Fallback — plain years page
========================= */

return 'years.html';

}


function bindYearsBreadcrumbLink() {

const link =
    document.getElementById(
        'yearsBreadcrumbLink'
    );


if (
    !link
) {

    return;
}


link.setAttribute(
    'href',
    resolveYearsBreadcrumbHref()
);

}


/* =========================
DOM REFERENCES
========================= */

const els = {};


function cacheDom() {

els.skeletonGrid =
    document.getElementById(
        'skeletonGrid'
    );

els.subjectsGrid =
    document.getElementById(
        'subjectsGrid'
    );

els.emptyState =
    document.getElementById(
        'emptyState'
    );

els.errorState =
    document.getElementById(
        'errorState'
    );

els.emptyRetryBtn =
    document.getElementById(
        'emptyRetryBtn'
    );

els.errorRetryBtn =
    document.getElementById(
        'errorRetryBtn'
    );

}


/* =========================
INIT SUBJECTS PAGE
========================= */

async function initSubjectsPage() {

/* =========================
    CACHE DOM
========================= */

cacheDom();


/* =========================
    BREADCRUMB — BACK TO SAME STAGE'S YEARS
========================= */

bindYearsBreadcrumbLink();


/* =========================
    RENDER SKELETON
========================= */

renderSkeletonRows();


/* =========================
    RETRY BUTTONS
========================= */

bindRetryButtons();


/* =========================
    CHECK YEAR ID
========================= */

if (
    !yearId ||
    yearId <= 0
) {

    console.error(
        'Invalid Year ID:',
        yearId
    );

    showError();

    return;
}


/* =========================
    AUTH
========================= */

const refreshed =
    await refreshToken();


if (!refreshed) {

    window.location.href =
        'login.html';

    return;
}


/* =========================
    LOAD SUBJECTS
========================= */

await loadSubjects();

}


/* =========================
RETRY BUTTONS
========================= */

function bindRetryButtons() {

if (
    els.emptyRetryBtn
) {

    els.emptyRetryBtn.addEventListener(
        'click',
        loadSubjects
    );

}


if (
    els.errorRetryBtn
) {

    els.errorRetryBtn.addEventListener(
        'click',
        loadSubjects
    );

}

}


/* =========================
STATE HELPERS
========================= */

function showSkeleton() {

toggleVisibility(
    els.skeletonGrid,
    true
);

toggleVisibility(
    els.subjectsGrid,
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


function showSubjects() {

toggleVisibility(
    els.skeletonGrid,
    false
);

toggleVisibility(
    els.subjectsGrid,
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
    els.subjectsGrid,
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
    els.subjectsGrid,
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
    'd-none',
    !isVisible
);

}


/* =========================
LOAD SUBJECTS FROM API
========================= */

async function loadSubjects() {

showSkeleton();


try {

    /* =========================
        API URL

        Example:
        /api/Dashboard/get-subjects?YearId=5
    ========================= */

    const url =
        `${SUBJECTS_API_URL}?YearId=${encodeURIComponent(yearId)}`;

    /* =========================
        GET REQUEST
    ========================= */

    let response =
        await apiRequest(
            url,
            {
                method: 'GET'
            }
        );


    console.log(
        'Subjects API Response:',
        response
    );


    /* =========================
        TOKEN EXPIRED
    ========================= */

    if (
        response.status === 401
    ) {

        console.log(
            'Access token expired. Refreshing token...'
        );


        const refreshed =
            await refreshToken();


        if (!refreshed) {

            window.location.href =
                'login.html';

            return;
        }


        /* =========================
            RETRY REQUEST
        ========================= */

        response =
            await apiRequest(
                url,
                {
                    method: 'GET'
                }
            );


        console.log(
            'Subjects API Retry Response:',
            response
        );

    }


    /* =========================
        CHECK RESPONSE
    ========================= */

    if (
        !response.ok
    ) {

        console.error(
            'Subjects API Error:',
            response.status
        );


        showError();


        return;
    }


    /* =========================
        READ JSON
    ========================= */

    const subjects =
        await response.json();


    console.log(
        'Subjects Data:',
        subjects
    );


    /* =========================
        CHECK EMPTY DATA
    ========================= */

    if (
        !Array.isArray(
            subjects
        ) ||
        subjects.length === 0
    ) {

        showEmpty();


        return;
    }


    /* =========================
        RENDER SUBJECTS
    ========================= */

    renderSubjectRows(
        subjects
    );


    /* =========================
        SHOW SUBJECTS
    ========================= */

    showSubjects();


} catch (
    error
) {

    console.error(
        'Failed to load subjects:',
        error
    );


    showError();

}

}


/* =========================
SKELETON ROWS
========================= */

function renderSkeletonRows() {

if (
    !els.skeletonGrid
) {

    return;
}


const fragment =
    document.createDocumentFragment();


for (
    let i = 0;
    i < SKELETON_ROW_COUNT;
    i++
) {

    fragment.appendChild(
        buildSkeletonRow()
    );

}


els.skeletonGrid.innerHTML =
    '';


els.skeletonGrid.appendChild(
    fragment
);

}


/* =========================
BUILD SKELETON ROW
========================= */

function buildSkeletonRow() {

const col =
    document.createElement(
        'div'
    );


col.className =
    'col-12 col-md-6 col-lg-4 subject-col';


const card =
    document.createElement(
        'div'
    );


card.className =
    'gc skeleton-card skeleton-row';


card.setAttribute(
    'aria-hidden',
    'true'
);


const icon =
    document.createElement(
        'div'
    );


icon.className =
    'skeleton-shape skeleton-icon';


const body =
    document.createElement(
        'div'
    );


body.className =
    'skeleton-body';


const line =
    document.createElement(
        'div'
    );


line.className =
    'skeleton-shape skeleton-line';


const btn =
    document.createElement(
        'div'
    );


btn.className =
    'skeleton-shape skeleton-btn';


body.appendChild(
    line
);


body.appendChild(
    btn
);


card.appendChild(
    icon
);


card.appendChild(
    body
);


col.appendChild(
    card
);


return col;

}


/* =========================
RENDER SUBJECT ROWS
========================= */

function renderSubjectRows(
subjects
) {

if (
    !els.subjectsGrid
) {

    return;
}


const fragment =
    document.createDocumentFragment();


subjects.forEach(
    function (subject) {

        fragment.appendChild(
            buildSubjectRow(
                subject
            )
        );

    }
);


els.subjectsGrid.innerHTML =
    '';


els.subjectsGrid.appendChild(
    fragment
);

}


/* =========================
BUILD SUBJECT ROW
========================= */

function buildSubjectRow(
subject
) {

const col =
    document.createElement(
        'div'
    );


col.className =
    'col-12 col-md-6 col-lg-4 subject-col';


col.setAttribute(
    'role',
    'listitem'
);


/* =========================
    CARD
========================= */

const card =
    document.createElement(
        'div'
    );


card.className =
    'gc subject-card';


card.setAttribute(
    'tabindex',
    '0'
);


card.setAttribute(
    'role',
    'button'
);


/* =========================
    SUBJECT ID
========================= */

const subjectId =
    subject.subjectId;


/* =========================
    SUBJECT NAME
========================= */

const subjectName =
    subject.name ||
    'مادة دراسية';


card.setAttribute(
    'aria-label',
    'فتح مادة ' +
    subjectName
);


/* =========================
    ICON BANNER
========================= */

const banner =
    document.createElement(
        'div'
    );


banner.className =
    'subject-banner';


const icon =
    document.createElement(
        'div'
    );


icon.className =
    'subject-icon';


icon.setAttribute(
    'aria-hidden',
    'true'
);


icon.innerHTML =
    '<i class="bi bi-book-half" aria-hidden="true"></i>';


banner.appendChild(
    icon
);


/* =========================
    BODY
========================= */

const body =
    document.createElement(
        'div'
    );


body.className =
    'subject-body';


/* =========================
    SUBJECT NAME
========================= */

const name =
    document.createElement(
        'h3'
    );


name.className =
    'subject-name';


name.textContent =
    subjectName;


body.appendChild(
    name
);


/* =========================
    DESCRIPTION
    (only rendered if the API actually returned it)
========================= */

if (
    subject.description &&
    String(
        subject.description
    ).trim() !== ''
) {

    const desc =
        document.createElement(
            'p'
        );


    desc.className =
        'subject-desc';


    desc.textContent =
        subject.description;


    body.appendChild(
        desc
    );

}


/* =========================
    LESSON COUNT
    (only rendered if the API actually returned it)
========================= */

if (
    subject.lessonCount !== undefined &&
    subject.lessonCount !== null
) {

    const meta =
        document.createElement(
            'p'
        );


    meta.className =
        'subject-meta';


    const lessonCount =
        Number(
            subject.lessonCount
        ) || 0;


    meta.innerHTML =
        '<i class="bi bi-play-btn-fill" aria-hidden="true"></i>' +
        `${lessonCount.toLocaleString('ar-EG')} درس`;


    body.appendChild(
        meta
    );

}


/* =========================
    CONTENT BADGES
    Static labels shown on every card, per request.
========================= */

const badges =
    document.createElement(
        'div'
    );


badges.className =
    'subject-badges';


badges.innerHTML =
    '<span class="subject-badge subject-badge-free">' +
        '<i class="bi bi-clipboard-check-fill" aria-hidden="true"></i>' +
        'امتحانات مجانية' +
    '</span>' +
    '<span class="subject-badge subject-badge-free">' +
        '<i class="bi bi-unlock-fill" aria-hidden="true"></i>' +
        'بنوك أسئلة مجانية' +
    '</span>' +
    '<span class="subject-badge subject-badge-paid">' +
        '<i class="bi bi-lock-fill" aria-hidden="true"></i>' +
        'محتوى إضافي مدفوع' +
    '</span>';


body.appendChild(
    badges
);


/* =========================
    PRICE
    Only rendered when the API returns a real, positive
    price. No price / free subject => no price section.
========================= */

const rawPrice =
    subject.price;


const numericPrice =
    Number(
        rawPrice
    );


if (
    rawPrice !== undefined &&
    rawPrice !== null &&
    !Number.isNaN(
        numericPrice
    ) &&
    numericPrice > 0
) {

    const priceBox =
        document.createElement(
            'div'
        );


    priceBox.className =
        'subject-price';


    const priceLabel =
        document.createElement(
            'span'
        );


    priceLabel.className =
        'subject-price-label';


    priceLabel.innerHTML =
        '<i class="bi bi-tag-fill" aria-hidden="true"></i>سعر المادة';


    const priceValue =
        document.createElement(
            'span'
        );


    priceValue.className =
        'subject-price-value';


    priceValue.textContent =
        `${numericPrice.toLocaleString('ar-EG')} ج.م`;


    priceBox.appendChild(
        priceLabel
    );


    priceBox.appendChild(
        priceValue
    );


    body.appendChild(
        priceBox
    );

}


/* =========================
    OPEN BUTTON
========================= */

const button =
    document.createElement(
        'button'
    );


button.type =
    'button';


button.className =
    'subject-btn';


button.setAttribute(
    'aria-label',
    'فتح مادة ' +
    subjectName
);


button.innerHTML =
    'عرض الدروس <i class="bi bi-arrow-left" aria-hidden="true"></i>';


body.appendChild(
    button
);


/* =========================
    OPEN SUBJECT
========================= */

const handleOpen =
    function (event) {

        event.stopPropagation();


        openSubject(
            subjectId
        );

    };


/* =========================
    CARD CLICK
========================= */

card.addEventListener(
    'click',
    function () {

        openSubject(
            subjectId
        );

    }
);


/* =========================
    KEYBOARD CLICK
========================= */

card.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key === 'Enter' ||
            event.key === ' '
        ) {

            event.preventDefault();


            openSubject(
                subjectId
            );

        }

    }
);


/* =========================
    BUTTON CLICK
========================= */

button.addEventListener(
    'click',
    handleOpen
);


/* =========================
    APPEND CARD
========================= */

card.appendChild(
    banner
);


card.appendChild(
    body
);


col.appendChild(
    card
);


return col;

}


/* =========================
OPEN SUBJECT
========================= */

function openSubject(
subjectId
) {

if (
    !subjectId
) {

    console.error(
        'Invalid Subject ID:',
        subjectId
    );


    return;
}


/*
    Example:

    lesson-details.html?subjectId=10
*/

window.location.href =
    'lessons.html?subjectId=' +
    encodeURIComponent(
        subjectId
    );

}