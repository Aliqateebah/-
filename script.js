const textInput = document.getElementById("text-input");
const generateVideoButton = document.getElementById("generate-video");
const downloadVideoButton = document.getElementById("download-video");
const videoOutput = document.getElementById("video-output");
const notesList = document.getElementById("notes-list");
const voiceSelect = document.getElementById("voice-select");
const backgroundSelect = document.getElementById("background-select");
const customBackground = document.getElementById("custom-background");
const videoDurationInput = document.getElementById("video-duration");
const videoResolutionSelect = document.getElementById("video-resolution");

let ffmpeg;
let videoBlob;

// تحميل مكتبة ffmpeg
const initFFmpeg = async () => {
    ffmpeg = FFmpeg.createFFmpeg({ log: true });
    await ffmpeg.load();
};

// إعداد قائمة الأصوات المتاحة
const setupVoices = () => {
    const voices = speechSynthesis.getVoices();
    voices.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
};

// إنشاء الفيديو من النص
const createVideoFromText = async (text) => {
    const audioUrl = await generateAudioFromText(text); // دالة لتوليد الصوت من النص
    const audioFileName = 'audio.mp3';

    // تحميل الصوت
    ffmpeg.FS('writeFile', audioFileName, await fetchFile(audioUrl));

    // إعدادات الفيديو
    const videoFileName = 'output.mp4';
    const [videoWidth, videoHeight] = videoResolutionSelect.value.split("x").map(Number);
    const videoDuration = parseInt(videoDurationInput.value); // مدة الفيديو بالثواني

    // إنشاء فيديو فارغ مع الصوت
    await ffmpeg.run('-f', 'lavfi', '-i', `color=c=${getBackgroundColor()}:s=${videoWidth}x${videoHeight}:d=${videoDuration}`, '-i', audioFileName, '-c:v', 'libx264', '-c:a', 'aac', '-shortest', videoFileName);

    // تحميل الفيديو الناتج
    const data = ffmpeg.FS('readFile', videoFileName);
    videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(videoBlob);
    
    videoOutput.innerHTML = `<video controls width="100%" src="${url}"></video>`;
    downloadVideoButton.style.display = 'block';
    addNoteToList(`تم إنشاء الفيديو من النص: "${text}"`);
};

// دالة لتوليد الصوت من النص باستخدام Web Speech API
const generateAudioFromText = async (text) => {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voiceSelect.value;
        const voices = speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.name === selectedVoice);
        utterance.onend = () => {
            resolve("audio.mp3"); // تم تحميل الصوت
        };
        speechSynthesis.speak(utterance);
    });
};

// إضافة ملاحظة إلى قائمة الملاحظات
function addNoteToList(note) {
    const li = document.createElement('li');
    li.textContent = note;
    notesList.appendChild(li);
}

// تحميل ملف الصوت
async function fetchFile(url) {
    const response = await fetch(url);
    return response.arrayBuffer();
}

// الحصول على لون الخلفية
function getBackgroundColor() {
    if (backgroundSelect.value === "custom") {
        return customBackground.value.replace('#', ''); // Remove the #
    }
    return backgroundSelect.value;
}

// حدث زر إنشاء الفيديو
generateVideoButton.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (text) {
        await createVideoFromText(text);
    } else {
        alert('يرجى إدخال نص لتحويله إلى فيديو.');
    }
});

// حدث زر تحميل الفيديو
downloadVideoButton.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(videoBlob);
    a.download = 'output.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// تهيئة مكتبة ffmpeg والأصوات
initFFmpeg();
setupVoices();