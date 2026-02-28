 const firebaseConfig = {
     apiKey: "AIzaSyCEU_hkazFaQ47eBcWglU0QZr5N4i_XPFk",
     authDomain: "eng-vocab-website.firebaseapp.com",
     projectId: "eng-vocab-website",
     storageBucket: "eng-vocab-website.firebasestorage.app",
     messagingSenderId: "669746577120",
     appId: "1:669746577120:web:494b943ef1319ce4d69a85",
     measurementId: "G-DHBPC5RL89"
 };

 firebase.initializeApp(firebaseConfig);
 const db = firebase.firestore();
 let currentSongList = [];
 let currentIndex = -1;

 const cloudName = 'dglxrlydv';
 const uploadPreset = 'vocab_images';

 function showNotification(message) {
     const notif = document.getElementById('notification');
     notif.textContent = message;
     notif.style.display = 'block';
     setTimeout(() => {
         notif.style.display = 'none';
     }, 2000);
 }

 async function playAudio() {
     try {
         await document.getElementById('audio').play();
         document.getElementById('song-name').style.display = 'block';
         document.getElementById('play-btn').style.display = 'none';
     } catch (e) {
         console.log('Autoplay blocked: ' + e.message);
     }
 }

 async function uploadFile() {
     const file = document.getElementById('file-input').files[0];
     const album = document.getElementById('album-select').value;
     if (!file) return;
     if (!album) {
         alert('Vui lòng chọn album');
         return;
     }
     document.getElementById('overlay').style.display = 'block';
     const formData = new FormData();
     formData.append('file', file);
     formData.append('upload_preset', uploadPreset);
     try {
         const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
             method: 'POST',
             body: formData
         });
         const data = await response.json();
         const url = data.secure_url;
         const name = file.name;
         await db.collection('music').add({ name, url, album });
         document.getElementById('overlay').style.display = 'none';
         showNotification('Upload successful: ' + name);
         loadAlbumList();
     } catch (error) {
         document.getElementById('overlay').style.display = 'none';
         console.error('Upload failed:', error);
         alert('Upload failed');
     }
 }

 async function loadAlbums() {
   try {
     const snapshot = await db.collection('albums').get();
     const select = document.getElementById('album-select');
     select.innerHTML = '<option value="">Chọn Album</option>';
     snapshot.forEach(doc => {
       const data = doc.data();
       const option = document.createElement('option');
       option.value = doc.id;
       option.textContent = data.name;
       select.appendChild(option);
     });
   } catch (error) {
     console.error('Load albums failed:', error);
   }
 }
 
 async function loadAlbumList() {
     try {
         const snapshot = await db.collection('albums').get();
         const albumItems = document.getElementById('album-items');
         albumItems.innerHTML = '';
         snapshot.forEach(doc => {
             const data = doc.data();
             const p = document.createElement('p');
             p.textContent = data.name;
             p.style.color = 'white';
             p.style.cursor = 'pointer';
             p.style.fontFamily = "'Shalimar', cursive";
             p.style.fontSize = '24px';
             p.onclick = () => loadMusicForAlbum(doc.id);
             albumItems.appendChild(p);
         });
     } catch (error) {
         console.error('Load album list failed:', error);
     }
 }

 async function loadMusicForAlbum(albumId) {
     try {
         const albumDoc = await db.collection('albums').doc(albumId).get();
         const albumName = albumDoc.data().name;
         const snapshot = await db.collection('music').where('album', '==', albumId).get();
         const audioItems = document.getElementById('audio-items');
         audioItems.innerHTML = '';
         currentSongList = [];
         currentIndex = -1;
         const docs = [];
         snapshot.forEach(doc => docs.push(doc));
         docs.sort((a, b) => a.data().name.localeCompare(b.data().name));
         let index = 0;
         docs.forEach(doc => {
             const data = doc.data();
             data.albumName = albumName;
             currentSongList.push(data);
             const p = document.createElement('p');
             p.textContent = data.name.replace('.mp3', '');
             p.style.color = 'white';
             p.style.cursor = 'pointer';
             p.style.fontFamily = "'Shalimar', cursive";
             p.style.fontSize = '24px';
             p.dataset.index = index;
             if (albumName === 'Nhạc Trung') {
                 p.style.fontFamily = "'Ma Shan Zheng', sans-serif";
             }
             p.onclick = () => {
                 currentIndex = index;
                 document.getElementById('audio').src = data.url;
                 document.getElementById('audio').load();
                 document.getElementById('audio').play();
                 document.getElementById('song-name').style.display = 'block';
                 document.getElementById('song-name').textContent = data.name.replace('.mp3', '');
                 document.getElementById('play-btn').style.display = 'none';
                 document.getElementById('controls').style.display = 'block';
                 const allP = document.querySelectorAll('#audio-items p');
                 allP.forEach(p => p.classList.remove('playing'));
                 p.classList.add('playing');
             };
             audioItems.appendChild(p);
             index++;
         });
         document.getElementById('audio-list').style.display = 'block';
         if (currentSongList.length > 0) {
             currentIndex = 0;
             playCurrentSong();
         }
     } catch (error) {
         console.error('Load music for album failed:', error);
     }
 }

 async function createAlbum() {
     const name = document.getElementById('new-album-name').value.trim();
     if (!name) {
         alert('Vui lòng nhập tên album');
         return;
     }
     document.getElementById('overlay').style.display = 'block';
     try {
         await db.collection('albums').add({ name });
         showNotification('Album created: ' + name);
         loadAlbums();
         loadAlbumList();
         document.getElementById('new-album-name').value = '';
     } catch (error) {
         console.error('Create album failed:', error);
         alert('Create album failed');
     } finally {
         document.getElementById('overlay').style.display = 'none';
     }
 }

 function toggleUploadForm() {
   const modal = document.getElementById('upload-modal');
   modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
 }

 window.playAudio = playAudio;
 window.uploadFile = uploadFile;
 window.toggleUploadForm = toggleUploadForm;
 window.createAlbum = createAlbum;
 
 function playCurrentSong() {
   const data = currentSongList[currentIndex];
   document.getElementById('audio').src = data.url;
   document.getElementById('audio').play();
   document.getElementById('play-pause-btn').textContent = '❚❚';
   document.getElementById('song-name').style.display = 'block';
   document.getElementById('song-name').textContent = data.name.replace('.mp3', '');
   if (data.name.includes('黄昏-周传雄') || data.albumName === 'Nhạc Trung') {
     document.getElementById('song-name').style.fontFamily = "'Ma Shan Zheng', sans-serif";
   } else {
     document.getElementById('song-name').style.fontFamily = "'Shalimar', cursive";
   }
   document.getElementById('play-btn').style.display = 'none';
   document.getElementById('controls').style.display = 'block';
   const allP = document.querySelectorAll('#audio-items p');
   allP.forEach(p => p.classList.remove('playing'));
   const currentP = document.querySelector(`#audio-items p[data-index="${currentIndex}"]`);
   if (currentP) currentP.classList.add('playing');
 }
 
 function formatTime(seconds) {
   const min = Math.floor(seconds / 60);
   const sec = Math.floor(seconds % 60);
   return `${min}:${sec.toString().padStart(2, '0')}`;
 }

 const backgroundImages = [
     'background/1.jpg',
     'background/2.jpg',
     'background/3.jpg',
     'background/4.jpg'
 ];
 let currentBackgroundIndex = 0;
 let currentBg = 1;
 function preloadImage(src) {
   return new Promise((resolve, reject) => {
     const img = new Image();
     img.onload = resolve;
     img.onerror = reject;
     img.src = src;
   });
 }
 
 function changeBackground() {
     const nextBg = currentBg === 1 ? 2 : 1;
     const nextDiv = document.getElementById('background' + nextBg);
     nextDiv.style.backgroundImage = `url('${backgroundImages[currentBackgroundIndex]}')`;
     nextDiv.style.zIndex = '0';
     nextDiv.style.transform = 'translateX(100%)';
     setTimeout(() => {
         nextDiv.style.transform = 'translateX(0%)';
         document.getElementById('background' + currentBg).style.zIndex = '-1';
     }, 0);
     document.getElementById('background' + currentBg).style.transform = 'translateX(-100%)';
     setTimeout(() => {
         document.getElementById('background' + currentBg).style.backgroundImage = '';
         document.getElementById('background' + currentBg).style.transform = 'translateX(100%)';
         currentBg = nextBg;
         nextDiv.style.zIndex = '-1';
     }, 3000);
     currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundImages.length;
 }
 window.onload = function() {
   loadAlbums();
   loadAlbumList();
   const defaultImagePromise = new Promise((resolve, reject) => {
     const img = new Image();
     img.onload = resolve;
     img.onerror = reject;
     img.src = 'photos/Default.jpg';
   });
   Promise.all([defaultImagePromise, ...backgroundImages.map(preloadImage)]).then(() => {
     document.getElementById('background1').style.opacity = '1';
     changeBackground();
     setInterval(changeBackground, 10000);
   });
   document.getElementById('prev-btn').onclick = () => {
     if (currentIndex > 0) {
       currentIndex--;
       playCurrentSong();
     }
   };
   document.getElementById('next-btn').onclick = () => {
     if (currentIndex < currentSongList.length - 1) {
       currentIndex++;
       playCurrentSong();
     }
   };
   document.getElementById('play-pause-btn').onclick = () => {
     const audio = document.getElementById('audio');
     if (audio.paused) {
       audio.play();
       document.getElementById('play-pause-btn').textContent = '❚❚';
     } else {
       audio.pause();
       document.getElementById('play-pause-btn').textContent = '▶';
     }
   };
   document.getElementById('seek-bar').oninput = (e) => {
     const audio = document.getElementById('audio');
     const seekTo = (e.target.value / 100) * audio.duration;
     audio.currentTime = seekTo;
   };
   document.getElementById('audio').ontimeupdate = () => {
     const audio = document.getElementById('audio');
     const seekBar = document.getElementById('seek-bar');
     const currentTimeSpan = document.getElementById('current-time');
     const durationSpan = document.getElementById('duration');
     if (audio.duration) {
       seekBar.value = (audio.currentTime / audio.duration) * 100;
       currentTimeSpan.textContent = formatTime(audio.currentTime);
       durationSpan.textContent = formatTime(audio.duration);
       const percentage = (audio.currentTime / audio.duration) * 100;
       seekBar.style.background = `linear-gradient(to right, rgba(255, 0, 0, 0.8) 0%, rgba(255, 0, 0, 0.8) ${percentage}%, rgba(255, 255, 255, 0.5) ${percentage}%, rgba(255, 255, 255, 0.5) 100%)`;
     }
   };
   document.getElementById('audio').onended = () => {
     if (currentIndex < currentSongList.length - 1) {
       currentIndex++;
       playCurrentSong();
     }
   };
 };