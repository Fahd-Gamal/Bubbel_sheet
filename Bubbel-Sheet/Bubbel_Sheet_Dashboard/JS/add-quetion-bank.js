(() => {
    'use strict';

    const CONFIG = {
        QUESTION_BANK_API: '/QuestionBank',
        // IMPORTANT: Add/Delete are intentionally NOT invented.
        // Put the real Teacher contract here only after the backend provides it.
        ADD_API: "/Question/add-Question",
        DELETE_API: "/Question/delete-Question"
    };

    const state = {
        bankId: null,
        bank: null,
        questions: [],
        pendingDeleteId: null
    };

    const $ = (id) => document.getElementById(id);
    const els = {
        questionList: $('questionList'),
        countLabel: $('countLabel'),
        heroCount: $('heroCount'),
        sideCount: $('sideCount'),
        heroStatus: $('heroStatus'),
        bankRef: $('bankRef'),
        retryBtn: $('retryBtn'),
        openAddBtn: $('openAddBtn'),
        openAddBtn2: $('openAddBtn2'),
        addModal: $('addModal'),
        closeAddBtn: $('closeAddBtn'),
        cancelAddBtn: $('cancelAddBtn'),
        addForm: $('addForm'),
        textQuestionField: $('textQuestionField'),
        imageQuestionField: $('imageQuestionField'),
        questionTitle: $('questionTitle'),
        questionImage: $('questionImage'),
        uploadCard: $('uploadCard'),
        imagePreviewCard: $('imagePreviewCard'),
        imagePreviewName: $('imagePreviewName'),
        questionImagePreview: $('questionImagePreview'),
        removeImageBtn: $('removeImageBtn'),
        formImageObjectUrl: null,
        mcqFields: $('mcqFields'),
        tfFields: $('tfFields'),
        deleteModal: $('deleteModal'),
        closeDeleteBtn: $('closeDeleteBtn'),
        cancelDeleteBtn: $('cancelDeleteBtn'),
        confirmDeleteBtn: $('confirmDeleteBtn'),
        toast: $('toast'),
        previewImageWrap: $('previewImageWrap'),
        previewImage: $('previewImage'),
        previewObjectUrl: null
    };

    const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
    let toastTimer = null;

    function getBankId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('QBankId') || params.get('qBankId') || params.get('bankId');
    }

    function getTypeKey(question) {
        const choices = Array.isArray(question?.choices) ? question.choices : [];
        if (choices.length === 4) return 'mcq';
        if (choices.length === 2) return 'true_false';
        return 'unknown';
    }

    function getTypeLabel(question) {
        const type = getTypeKey(question);
        if (type === 'mcq') return 'MCQ';
        if (type === 'true_false') return 'True / False';
        return 'نوع غير معروف';
    }

    function escapeText(value) {
        return String(value ?? '');
    }

    function showToast(message, kind = '') {
        clearTimeout(toastTimer);
        els.toast.textContent = message;
        els.toast.className = 'toast show' + (kind ? ' ' + kind : '');
        toastTimer = setTimeout(() => {
            els.toast.classList.remove('show');
        }, 3600);
    }

    function setLoading() {
        els.heroStatus.textContent = 'جاري التحميل';
        els.questionList.innerHTML = `
    <div class="loading">
    <div class="state-box">
        <div class="spinner"></div>
        <h3>جاري تحميل الأسئلة...</h3>
        <p>يتم جلب الأسئلة الآن من Question Bank API.</p>
    </div>
    </div>`;
    }

    function setError(message) {
        els.heroStatus.textContent = 'خطأ';
        els.questionList.innerHTML = `
    <div class="error">
    <div class="state-box">
        <div class="state-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
        <h3>حدث خطأ أثناء تحميل الأسئلة</h3>
        <p>${escapeText(message || 'تعذر تحميل بيانات البنك.')}</p>
        <button class="btn btn-primary" id="inlineRetry" type="button"><i class="bi bi-arrow-clockwise"></i> إعادة المحاولة</button>
    </div>
    </div>`;
        const inlineRetry = $('inlineRetry');
        if (inlineRetry) inlineRetry.addEventListener('click', loadQuestions);
    }

    function setEmpty() {
        els.heroStatus.textContent = 'فارغ';
        els.questionList.innerHTML = `
    <div class="empty">
    <div class="state-box">
        <div class="state-icon"><i class="bi bi-inbox"></i></div>
        <h3>لا توجد أسئلة حاليًا</h3>
        <p>ابدأ بإضافة أول سؤال إلى بنك الأسئلة عندما يكون Add API متاحًا.</p>
        <button class="btn btn-primary" type="button" id="emptyAddBtn"><i class="bi bi-plus-lg"></i> إضافة سؤال</button>
    </div>
    </div>`;
        const emptyAddBtn = $('emptyAddBtn');
        if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);
    }

    function updateCounters() {
        const count = state.questions.length;
        const label = `عدد الأسئلة: ${count}`;
        els.countLabel.textContent = label;
        els.heroCount.textContent = String(count);
        els.sideCount.textContent = String(count);
    }

    function renderQuestions() {
        updateCounters();
        if (!state.questions.length) {
            setEmpty();
            return;
        }

        els.heroStatus.textContent = 'متاح';
        const fragment = document.createDocumentFragment();
        state.questions.forEach((question, index) => fragment.appendChild(buildQuestionCard(question, index + 1)));
        els.questionList.replaceChildren(fragment);
    }

    function buildQuestionCard(question, number) {
        const article = document.createElement('article');
        article.className = 'question-card';
        article.dataset.questionId = String(question.questionId);

        const head = document.createElement('div');
        head.className = 'question-head';

        const numberWrap = document.createElement('div');
        numberWrap.className = 'q-number';
        numberWrap.innerHTML = `<div class="q-index">${number}</div><div class="badges"><span class="badge"><i class="bi bi-hash"></i>${escapeText(question.questionId)}</span><span class="badge type"><i class="bi bi-ui-checks-grid"></i>${escapeText(getTypeLabel(question))}</span></div>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.title = 'حذف السؤال';
        deleteBtn.setAttribute('aria-label', 'حذف السؤال');
        deleteBtn.innerHTML = '<i class="bi bi-trash3"></i>';
        deleteBtn.addEventListener('click', () => openDeleteModal(question.questionId));

        head.append(numberWrap, deleteBtn);
        article.appendChild(head);

        const content = document.createElement('div');
        content.className = 'question-content';

        if (question.questionTitle) {
            const p = document.createElement('p');
            p.className = 'question-text';
            p.textContent = question.questionTitle;
            content.appendChild(p);
        }

        if (question.imgLink) {
            const wrap = document.createElement('div');
            wrap.className = 'image-wrap';
            const img = document.createElement('img');
            img.src = question.imgLink;
            img.alt = `صورة السؤال ${number}`;
            img.loading = 'lazy';
            img.draggable = false;
            img.addEventListener('error', () => {
                wrap.innerHTML = '<div style="padding:28px;text-align:center;color:#6878a8;font-size:12px;font-weight:700">تعذر تحميل صورة السؤال.</div>';
            });
            wrap.appendChild(img);
            content.appendChild(wrap);
        }

        if (Array.isArray(question.choices) && question.choices.length) {
            content.appendChild(buildAnswers(question));
        }

        article.appendChild(content);
        return article;
    }

    function buildAnswers(question) {
        const answers = document.createElement('div');
        answers.className = 'answers';
        const isTF = getTypeKey(question) === 'true_false';
        const labels = isTF ? ['صح', 'خطأ'] : OPTION_LETTERS;

        question.choices.forEach((choice, index) => {
            const row = document.createElement('div');
            row.className = 'answer' + (choice.isCorrect ? ' correct' : '');

            const letter = document.createElement('div');
            letter.className = 'answer-letter';
            letter.textContent = labels[index] || String(index + 1);

            const text = document.createElement('div');
            text.className = 'answer-text';
            text.textContent = choice.choiceText ?? choice.text ?? choice.choiseText ?? choice.answerText ?? labels[index] ?? '';

            row.append(letter, text);

            if (Boolean(choice.isCorrect)) {
                const correct = document.createElement('span');
                correct.className = 'correct-label';
                correct.innerHTML = '<i class="bi bi-check-circle-fill"></i> الإجابة الصحيحة';
                row.appendChild(correct);
            }

            answers.appendChild(row);
        });

        return answers;
    }

    async function loadQuestions() {
        state.bankId = getBankId();
        els.bankRef.textContent = `QBankId: ${state.bankId || '—'}`;

        if (!state.bankId) {
            setError('لم يتم تحديد QBankId في رابط الصفحة.');
            return;
        }

        setLoading();
        try {
            if (typeof window.apiRequest !== 'function') {
                throw new Error('apiRequest() غير محمل في الصفحة. اربط auth.js/helper الحالي قبل تشغيل الصفحة.');
            }

            // REAL student-side endpoint from the supplied reference.
            const endpoint = `${CONFIG.QUESTION_BANK_API}/open-QuestionBank?QBankId=${encodeURIComponent(state.bankId)}`;
            const response = await window.apiRequest(endpoint, { method: 'GET' });

            if (!response.ok) {
                let errorText = '';
                try { errorText = await response.text(); } catch (_) { }
                if (response.status === 401) throw new Error('غير مصرح لك. برجاء تسجيل الدخول مرة أخرى.');
                throw new Error(errorText || `فشل تحميل الأسئلة (${response.status})`);
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.questions)) {
                throw new Error('صيغة استجابة بنك الأسئلة غير متوقعة.');
            }

            state.bank = data;
            state.questions = data.questions.map(normalizeQuestion);
            renderQuestions();
        } catch (error) {
            console.error('Teacher Question Bank GET Error:', error);
            setError(error.message || 'حدث خطأ أثناء تحميل الأسئلة.');
        }
    }

    function normalizeQuestion(question) {
        return {
            ...question,
            questionId: Number(question?.questionId),
            questionTitle: question?.questionTitle || '',
            questionType: question?.questionType ?? null,
            imgLink: question?.imgLink || null,
            choices: Array.isArray(question?.choices)
                ? question.choices.map(choice => ({
                    ...choice,
                    choiseId: Number(choice?.choiseId),
                    isCorrect: Boolean(choice?.isCorrect)
                }))
                : []
        };
    }

    function openAddModal() { els.addModal.classList.remove('hidden'); }
    function closeAddModal() { els.addModal.classList.add('hidden'); els.addForm.reset(); clearFormErrors(); resetFormImageUrl(); syncImagePicker(); syncAddForm(); }
    function openDeleteModal(questionId) {
        state.pendingDeleteId = Number(questionId);
        els.deleteModal.classList.remove('hidden');
    }
    function closeDeleteModal() {
        state.pendingDeleteId = null;
        els.deleteModal.classList.add('hidden');
    }

    function syncAddForm() {
        const type = document.querySelector('input[name="addType"]:checked')?.value || 'mcq';
        const contentMode = document.querySelector('input[name="contentMode"]:checked')?.value || 'text';
        // Text and image are independent. The teacher can use either one or both.
        els.textQuestionField.classList.toggle('hidden-field', contentMode === 'image');
        els.imageQuestionField.classList.toggle('hidden-field', contentMode === 'text');
        els.mcqFields.classList.toggle('hidden-field', type !== 'mcq');
        els.tfFields.classList.toggle('hidden-field', type !== 'true_false');
        updatePreview();
    }

    function clearFormErrors() {
        ['textError', 'mcqError', 'tfError'].forEach(id => $(id)?.classList.remove('show'));
    }

    function collectAddForm() {
        clearFormErrors();
        const type = document.querySelector('input[name="addType"]:checked')?.value || 'mcq';
        const contentMode = document.querySelector('input[name="contentMode"]:checked')?.value || 'text';
        const title = els.questionTitle.value.trim();
        const file = els.questionImage.files?.[0] || null;

        if (contentMode !== 'image' && !title) {
            $('textError')?.classList.add('show');
            throw new Error('اكتب نص السؤال أو اختر صورة للسؤال.');
        }
        if (contentMode !== 'text' && !file) {
            $('textError')?.classList.add('show');
            throw new Error('اختر صورة السؤال أو اكتب نص السؤال.');
        }

        if (type === 'mcq') {
            const choices = [...document.querySelectorAll('[data-choice]')].map(el => el.value.trim());
            const correct = document.querySelector('input[name="correctChoice"]:checked');
            if (choices.some(value => !value) || !correct) {
                $('mcqError')?.classList.add('show');
                throw new Error('اكمل الإجابات الأربع وحدد إجابة صحيحة واحدة.');
            }
            return { type, contentMode, title, file, choices, correctIndex: Number(correct.value) };
        }

        const tfCorrect = document.querySelector('input[name="tfCorrect"]:checked');
        if (!tfCorrect) {
            $('tfError')?.classList.add('show');
            throw new Error('حدد الإجابة الصحيحة: صح أو خطأ.');
        }
        return { type, contentMode, title, file, tfCorrect: tfCorrect.value === 'true' };
    }

    function resetPreviewUrl() {
        if (els.previewObjectUrl) {
            URL.revokeObjectURL(els.previewObjectUrl);
            els.previewObjectUrl = null;
        }
    }

    function resetFormImageUrl() {
        if (els.formImageObjectUrl) {
            URL.revokeObjectURL(els.formImageObjectUrl);
            els.formImageObjectUrl = null;
        }
    }

    function syncImagePicker() {
        const file = els.questionImage.files?.[0] || null;
        resetFormImageUrl();
        if (file) {
            const url = URL.createObjectURL(file);
            els.formImageObjectUrl = url;
            els.questionImagePreview.src = url;
            els.imagePreviewName.textContent = file.name;
            els.imagePreviewCard.classList.remove('hidden-field');
            els.uploadCard.classList.add('hidden-field');
        } else {
            els.questionImagePreview.removeAttribute('src');
            els.imagePreviewName.textContent = '';
            els.imagePreviewCard.classList.add('hidden-field');
            els.uploadCard.classList.remove('hidden-field');
        }
    }

    function clearSelectedImage() {
        els.questionImage.value = '';
        syncImagePicker();
        updatePreview();
    }

    function updatePreview() {
        const type = document.querySelector('input[name="addType"]:checked')?.value || 'mcq';
        const contentMode = document.querySelector('input[name="contentMode"]:checked')?.value || 'text';
        const title = els.questionTitle.value.trim();
        const file = els.questionImage.files?.[0] || null;

        $('previewType').textContent = type === 'mcq' ? 'MCQ' : 'True / False';
        $('previewText').textContent = title || (contentMode === 'image' ? 'صورة السؤال ستظهر هنا.' : 'اكتب نص السؤال ليظهر هنا.');
        $('previewAnswers').innerHTML = '';
        resetPreviewUrl();

        if (file) {
            const url = URL.createObjectURL(file);
            els.previewObjectUrl = url;
            $('previewImage').src = url;
            $('previewImageWrap').classList.add('show');
        } else {
            $('previewImageWrap').classList.remove('show');
            $('previewImage').removeAttribute('src');
        }

        if (type === 'mcq') {
            const values = [...document.querySelectorAll('[data-choice]')].map(el => el.value.trim());
            const correctChoice = document.querySelector('input[name="correctChoice"]:checked');
            const correctIndex = correctChoice ? Number(correctChoice.value) : -1;
            values.forEach((value, index) => {
                const isCorrect = index === correctIndex;
                const row = document.createElement('div');
                row.className = 'preview-answer' + (isCorrect ? ' is-correct' : '');
                row.innerHTML = `<div class="preview-answer-key">${OPTION_LETTERS[index]}</div><div class="preview-answer-text"></div><div class="preview-answer-check"><i class="bi bi-check-circle-fill"></i></div>`;
                row.querySelector('.preview-answer-text').textContent = value || `الإجابة ${OPTION_LETTERS[index]}`;
                $('previewAnswers').appendChild(row);
            });
        } else {
            const tfCorrect = document.querySelector('input[name="tfCorrect"]:checked')?.value;
            [{ label: 'صح', value: 'true' }, { label: 'خطأ', value: 'false' }].forEach(({ label, value }) => {
                const isCorrect = tfCorrect === value;
                const row = document.createElement('div');
                row.className = 'preview-answer' + (isCorrect ? ' is-correct' : '');
                row.innerHTML = `<div class="preview-answer-key"><i class="bi bi-check2"></i></div><div class="preview-answer-text"></div><div class="preview-answer-check"><i class="bi bi-check-circle-fill"></i></div>`;
                row.querySelector('.preview-answer-text').textContent = label;
                $('previewAnswers').appendChild(row);
            });
        }

        const completeContent = contentMode === 'both' ? (title || file) : contentMode === 'text' ? !!title : !!file;
        const typeComplete = type === 'mcq'
            ? [...document.querySelectorAll('[data-choice]')].every(el => el.value.trim()) && !!document.querySelector('input[name="correctChoice"]:checked')
            : !!document.querySelector('input[name="tfCorrect"]:checked');
        $('previewStatus').textContent = completeContent && typeComplete ? 'جاهز للإضافة' : 'السؤال غير مكتمل';
        $('previewStatus').style.color = completeContent && typeComplete ? 'var(--success)' : 'var(--muted)';
    }

    async function handleAddSubmit(event) {
        event.preventDefault();
        try {
            const payload = collectAddForm();
           const formData = new FormData();

formData.append("QuestionTitle", payload.title);
formData.append(
    "QuestionType",
    payload.type === "mcq" ? "0" : "1"
);
formData.append("QBankID", state.bankId);

if (payload.file) {
    formData.append("Img", payload.file);
}

if (payload.type === "mcq") {
    payload.choices.forEach((text, index) => {
        formData.append(`Choices[${index}].Text`, text);
        formData.append(
            `Choices[${index}].IsCorrect`,
            String(index === payload.correctIndex)
        );
    });
}
else {
    formData.append("Choices[0].Text", "صح");
    formData.append(
        "Choices[0].IsCorrect",
        String(payload.tfCorrect)
    );

    formData.append("Choices[1].Text", "خطأ");
    formData.append(
        "Choices[1].IsCorrect",
        String(!payload.tfCorrect)
    );
}
const response = await apiRequest(
    "/Question/add-Question",
    {
        method: "POST",
        body: formData
    }
);

if (!response.ok) {
    throw new Error("تعذر إضافة السؤال.");
}

const newQuestion = await response.json();

closeAddModal();
await loadQuestions();
showToast('تم إضافة السؤال بنجاح', 'success');
        } catch (error) {
            showToast(error.message || 'تعذر إضافة السؤال.', 'error');
        }
    }

  async function handleDeleteConfirm() {
    if (state.pendingDeleteId == null) return;

    if (!CONFIG.DELETE_API) {
        showToast('واجهة الحذف غير متاحة.', 'error');
        return;
    }

    const id = state.pendingDeleteId;

    try {
        const response = await apiRequest(
            `${CONFIG.DELETE_API}?Id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            let errorMessage = '';

            try {
                errorMessage = await response.text();
            } catch (_) {
                // Ignore response parsing error
            }

            if (response.status === 401) {
                throw new Error('غير مصرح لك. برجاء تسجيل الدخول مرة أخرى.');
            }

            if (response.status === 403) {
                throw new Error('ليس لديك صلاحية حذف السؤال.');
            }

            throw new Error(
                errorMessage || `تعذر حذف السؤال (${response.status}).`
            );
        }

        closeDeleteModal();

        await loadQuestions();

        showToast('تم حذف السؤال بنجاح', 'success');

    } catch (error) {
        console.error('Delete Question Error:', error);

        showToast(
            error.message || 'تعذر حذف السؤال.',
            'error'
        );
    }
}

    function bindEvents() {
        els.retryBtn?.addEventListener('click', loadQuestions);
        els.openAddBtn?.addEventListener('click', openAddModal);
        els.openAddBtn2?.addEventListener('click', openAddModal);
        els.closeAddBtn?.addEventListener('click', closeAddModal);
        els.cancelAddBtn?.addEventListener('click', closeAddModal);
        els.closeDeleteBtn?.addEventListener('click', closeDeleteModal);
        els.cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
        els.confirmDeleteBtn?.addEventListener('click', handleDeleteConfirm);
        els.addForm?.addEventListener('submit', handleAddSubmit);
        document.querySelectorAll('input[name="addType"], input[name="contentMode"]').forEach(el => el.addEventListener('change', syncAddForm));
        els.questionTitle.addEventListener('input', updatePreview);
        els.questionImage.addEventListener('change', () => {
            syncImagePicker();
            updatePreview();
        });
        els.removeImageBtn?.addEventListener('click', clearSelectedImage);
        document.querySelectorAll('[data-choice]').forEach(el => el.addEventListener('input', updatePreview));
        document.querySelectorAll('input[name="correctChoice"], input[name="tfCorrect"]').forEach(el => el.addEventListener('change', updatePreview));

        [els.addModal, els.deleteModal].filter(Boolean).forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) modal.classList.add('hidden');
            });
        });
    }

    bindEvents();
    syncAddForm();
    syncImagePicker();
    loadQuestions();
})();