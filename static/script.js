const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const clearBtn = document.getElementById('clearBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');

let resizedFile = null;
const MAX_WIDTH = 1024; // Max width for client-side resize

// Drag and drop functionality
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('glow');
});

uploadSection.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('glow');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('glow');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    } else {
        alert('Please drop an image file (JPG or PNG)');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG or PNG)');
            fileInput.value = '';
            return;
        }
        handleFile(file);
    }
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // --- Image Resizing Logic ---
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = (MAX_WIDTH / width) * height;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Show preview of the resized image
            imagePreview.src = canvas.toDataURL('image/jpeg');

            // Convert canvas to blob for upload
            canvas.toBlob((blob) => {
                resizedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
            }, 'image/jpeg', 0.9); // 90% quality
        };
        img.src = e.target.result;

        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        previewSection.classList.add('fade-in');
        errorSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}


clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resizedFile = null;
    fileInput.value = '';
    uploadSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
});

analyzeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!resizedFile) {
        alert("Please wait for the image to be prepared.");
        return;
    };

    const formData = new FormData();
    formData.append('image', resizedFile);

    previewSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    resultsSection.classList.add('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingSection.classList.add('hidden');

        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        displayResults(data);
    } catch (error) {
        loadingSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        errorSection.classList.remove('hidden');
        errorMessage.textContent = error.message;
    }
});

function displayResults(data) {
    resultsSection.innerHTML = '';
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');

    if (data.message) {
        resultsSection.innerHTML = `
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">${data.message}</p>
            </div>
            <button onclick="window.location.reload()" class="w-full mt-4 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                Analyze Another Image
            </button>
        `;
        return;
    }

    let html = `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Nutritional Info Per Gram</h2>
        </div>
    `;

    if (data.foods && data.foods.length > 0) {
        data.foods.forEach((food) => {
            html += `
                <div class="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 mb-4 border border-purple-100 shadow-lg nutrition-card">
                    <h3 class="text-xl font-bold text-gray-800 text-center mb-4">${food.name}</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                            <p class="text-2xl font-bold text-blue-600 mb-1">${food.protein}</p>
                            <p class="text-xs text-gray-600 font-medium">Protein</p>
                        </div>
                        <div class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                            <p class="text-2xl font-bold text-yellow-600 mb-1">${food.carbs}</p>
                            <p class="text-xs text-gray-600 font-medium">Carbs</p>
                        </div>
                        <div class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                            <p class="text-2xl font-bold text-red-600 mb-1">${food.fat}</p>
                            <p class="text-xs text-gray-600 font-medium">Fat</p>
                        </div>
                        <div class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                            <p class="text-2xl font-bold text-purple-600 mb-1">${food.fiber}</p>
                            <p class="text-xs text-gray-600 font-medium">Fiber</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `
        <button onclick="window.location.reload()" class="w-full mt-6 btn-primary text-white py-3 rounded-lg font-semibold transition-transform">
            Analyze Another Image
        </button>
    `;

    resultsSection.innerHTML = html;
}
