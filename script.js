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
 let isRepeatMode = false;
 let isAlbumsLoaded = false;
 let currentView = 'albums';
 let isRainPlaying = false;
 let currentAlbumBackground = 'https://res.cloudinary.com/dglxrlydv/video/upload/v1772435335/Background_qelwz8.mp4';
 let manageSongs = [];

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
         console.error('Autoplay blocked: ' + e.message);
     }
 }

 async function uploadFile() {
     const file = document.getElementById('file-input').files[0];
     const album = document.getElementById('album-select').value;
     if (!file) return;
     if (!album) {
         alert('Please select an album');
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

 async function uploadSongBackgroundVideo(file) {
     document.getElementById('overlay').style.display = 'block';
     const formData = new FormData();
     formData.append('file', file);
     formData.append('upload_preset', uploadPreset);
     try {
         const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
             method: 'POST',
             body: formData
         });
         const data = await response.json();
         document.getElementById('overlay').style.display = 'none';
         return data.secure_url;
     } catch (error) {
         document.getElementById('overlay').style.display = 'none';
         console.error('Upload background video failed:', error);
         alert('Upload background video failed');
         return null;
     }
 }

 async function loadAlbums() {
   try {
     const snapshot = await db.collection('albums').get();
     const select = document.getElementById('album-select');
     select.innerHTML = '<option value="">Select album</option>';
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
             p.textContent = '✦ ' +data.name;
             p.style.color = 'white';
             p.style.cursor = 'pointer';
             p.style.fontFamily = "'Shalimar', cursive";
             p.style.fontSize = '24px';
             p.onclick = (event) => { event.stopPropagation(); loadMusicForAlbum(doc.id); };
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
         currentAlbumBackground = albumDoc.data().background || 'https://res.cloudinary.com/dglxrlydv/video/upload/v1772435335/Background_qelwz8.mp4';
         const bgVideo = document.getElementById('background-video');
         bgVideo.src = currentAlbumBackground;
         bgVideo.load();
         bgVideo.play();
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
                 const songName = data.name;
                 currentIndex = currentSongList.findIndex(song => song.name === songName);
                 setBackground(data);
                 document.getElementById('audio').src = data.url;
                 document.getElementById('audio').load();
                 document.getElementById('audio').play();
                 document.getElementById('song-name').style.display = 'block';
                 document.getElementById('song-name').textContent = data.name.replace('.mp3', '');
                 if (data.name.includes('黄昏-周传雄') || data.albumName === 'Nhạc Trung') {
                     document.getElementById('song-name').style.fontFamily = "'Ma Shan Zheng', sans-serif";
                 } else {
                     document.getElementById('song-name').style.fontFamily = "'Shalimar', cursive";
                 }
                 document.getElementById('controls').style.display = 'block';
                 const allP = document.querySelectorAll('#audio-items p');
                 allP.forEach(p => p.classList.remove('playing'));
                 p.classList.add('playing');
             };
             audioItems.appendChild(p);
             index++;
         });
         document.getElementById('album-items').style.display = 'none';
         document.getElementById('audio-list').style.display = 'block';
         currentView = 'music';
         if (currentSongList.length > 0) {
             currentIndex = 0;
             document.getElementById('controls').style.display = 'block';
             document.getElementById('song-name').style.display = 'block';
             playCurrentSong();
         }
     } catch (error) {
         console.error('Load music for album failed:', error);
     }
 }

 async function createAlbum() {
     const name = document.getElementById('new-album-name').value.trim();
     if (!name) {
         alert('Please enter the album name');
         return;
     }
     document.getElementById('overlay').style.display = 'block';
     try {
         await db.collection('albums').add({ name, background: '' });
         showNotification('Album created: ' + name);
         loadAlbums();
         if (isAlbumsLoaded) loadAlbumList();
         document.getElementById('new-album-name').value = '';
     } catch (error) {
         console.error('Create album failed:', error);
         alert('Create album failed');
     } finally {
         document.getElementById('overlay').style.display = 'none';
     }
 }

 async function toggleAlbums() {
     const albumItems = document.getElementById('album-items');
     const audioList = document.getElementById('audio-list');
     if (currentView === 'music') {
         audioList.style.display = 'none';
         if (isAlbumsLoaded) {
             albumItems.style.display = 'block';
         } else {
             await loadAlbumList();
             isAlbumsLoaded = true;
             albumItems.style.display = 'block';
         }
         currentView = 'albums';
     } else {
         if (!isAlbumsLoaded) {
             await loadAlbumList();
             isAlbumsLoaded = true;
         }
         albumItems.style.display = albumItems.style.display === 'none' ? 'block' : 'none';
     }
 }

 function playRainLoop() {
     const rainAudio = document.getElementById('rain-audio');
     const rainVideo = document.getElementById('rain-video');
     const button = document.getElementById('rain-button');
     if (!isRainPlaying) {
         rainAudio.src = 'https://res.cloudinary.com/dglxrlydv/video/upload/v1772433226/Rain_hgxd9x.mp3';
         rainAudio.play();
         rainVideo.play();
         rainVideo.style.display = 'block';
         isRainPlaying = true;
         button.style.color = 'orange';
     } else {
         rainAudio.pause();
         rainVideo.pause();
         rainVideo.style.display = 'none';
         isRainPlaying = false;
         button.style.color = '';
     }
 }

 async function toggleUploadForm() {
   const modal = document.getElementById('upload-modal');
   if (modal.style.display === 'none') {
     await loadAlbums();
   }
   modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
 }

 function toggleFunctionMenu() {
   const menu = document.getElementById('function-menu');
   menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
 }

 function toggleManageModal() {
   const modal = document.getElementById('manage-modal');
   modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
   if (modal.style.display === 'block') {
     loadSongsForManage();
     loadAlbumsForManage();
   }
 }

 async function loadSongsForManage() {
   try {
     const snapshot = await db.collection('music').get();
     const input = document.getElementById('song-input');
     const datalist = document.getElementById('song-list');
     datalist.innerHTML = '';
     manageSongs = [];
     const docs = [];
     snapshot.forEach(doc => docs.push(doc));
     docs.sort((a, b) => a.data().name.localeCompare(b.data().name));
     docs.forEach(doc => {
       const data = doc.data();
       manageSongs.push({ id: doc.id, name: data.name });
       const option = document.createElement('option');
       option.value = data.name.replace('.mp3', '');
       datalist.appendChild(option);
     });
   } catch (error) {
     console.error('Load songs for manage failed:', error);
   }
 }

 async function loadAlbumsForManage() {
   try {
     const snapshot = await db.collection('albums').get();
     const select = document.getElementById('album-move-select');
     select.innerHTML = '<option value="">Select an album to move to (optional)</option>';
     const docs = [];
     snapshot.forEach(doc => docs.push(doc));
     docs.sort((a, b) => a.data().name.localeCompare(b.data().name));
     docs.forEach(doc => {
       const data = doc.data();
       const option = document.createElement('option');
       option.value = doc.id;
       option.textContent = data.name;
       select.appendChild(option);
     });
   } catch (error) {
     console.error('Load albums for manage failed:', error);
   }
 }

 async function saveSongChanges() {
   const songNameInput = document.getElementById('song-input').value;
   if (!songNameInput) {
     alert('Please select a track');
     return;
   }
   const song = manageSongs.find(s => s.name.replace('.mp3', '') === songNameInput);
   if (!song) {
     alert('Track not found');
     return;
   }
   const songId = song.id;
   const newName = document.getElementById('new-song-name').value.trim();
   const newAlbum = document.getElementById('album-move-select').value;
   const file = document.getElementById('song-background-file-input').files[0];
   const updateData = {};
   if (newName) {
     updateData.name = newName + '.mp3';
   }
   if (newAlbum) {
     updateData.album = newAlbum;
   }
   if (file) {
     const url = await uploadSongBackgroundVideo(file);
     if (url) {
       updateData.backgroundVideo = url;
     }
   }
   if (Object.keys(updateData).length === 0 && !file) {
     alert('No changes');
     return;
   }
   try {
     await db.collection('music').doc(songId).update(updateData);
     showNotification('Update successful');
     toggleManageModal();
     if (isAlbumsLoaded) loadAlbumList();
     if (newAlbum) {
       loadAlbums();
     }
   } catch (error) {
     console.error('Update song failed:', error);
     alert('Update failed');
   }
 }

 async function deleteSong() {
     const songNameInput = document.getElementById('song-input').value;
     if (!songNameInput) {
       alert('Please select a track to delete');
       return;
     }
     const song = manageSongs.find(s => s.name.replace('.mp3', '') === songNameInput);
     if (!song) {
       alert('Track not found');
       return;
     }
     const songId = song.id;
   const confirmDelete = confirm('Are you sure you want to delete this track?');
   if (!confirmDelete) {
     return;
   }
   try {
     await db.collection('music').doc(songId).delete();
     showNotification('Delete track successful');
     toggleManageModal();
     if (isAlbumsLoaded) loadAlbumList();
   } catch (error) {
     console.error('Delete track failed:', error);
     alert('Delete track failed');
   }
 }

 async function deleteSongBackground() {
     const songNameInput = document.getElementById('song-input').value;
     if (!songNameInput) {
       alert('Please select a track');
       return;
     }
     const song = manageSongs.find(s => s.name.replace('.mp3', '') === songNameInput);
     if (!song) {
       alert('Track not found');
       return;
     }
     const songId = song.id;
   const confirmDelete = confirm('Are you sure you want to delete the background video for this track?');
   if (!confirmDelete) {
     return;
   }
   try {
     await db.collection('music').doc(songId).update({ backgroundVideo: null });
     showNotification('Background video deleted successfully');
     toggleManageModal();
   } catch (error) {
     console.error('Delete background video failed:', error);
     alert('Delete background video failed');
   }
 }

 function toggleBackgroundModal() {
   const modal = document.getElementById('background-modal');
   modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
   if (modal.style.display === 'block') {
     loadAlbumsForBackground();
   }
 }

 async function loadAlbumsForBackground() {
   try {
     const snapshot = await db.collection('albums').get();
     const select = document.getElementById('background-album-select');
     select.innerHTML = '<option value="">Select album</option>';
     snapshot.forEach(doc => {
       const data = doc.data();
       const option = document.createElement('option');
       option.value = doc.id;
       option.textContent = data.name;
       select.appendChild(option);
     });
   } catch (error) {
     console.error('Load albums for background failed:', error);
   }
 }

 async function saveBackground() {
   const albumId = document.getElementById('background-album-select').value;
   const file = document.getElementById('background-file-input').files[0];
   if (!albumId) {
     alert('Please select an album');
     return;
   }
   if (!file) {
     alert('Please select a video file');
     return;
   }
   document.getElementById('overlay').style.display = 'block';
   const formData = new FormData();
   formData.append('file', file);
   formData.append('upload_preset', uploadPreset);
   try {
     const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
       method: 'POST',
       body: formData
     });
     const data = await response.json();
     const url = data.secure_url;
     await db.collection('albums').doc(albumId).update({ background: url });
     showNotification('Background updated successfully');
     toggleBackgroundModal();
   } catch (error) {
     console.error('Save background failed:', error);
     alert('Save background failed');
   } finally {
     document.getElementById('overlay').style.display = 'none';
   }
 }

 window.playAudio = playAudio;
 window.uploadFile = uploadFile;
 window.toggleUploadForm = toggleUploadForm;
 window.toggleFunctionMenu = toggleFunctionMenu;
 window.createAlbum = createAlbum;
 window.toggleManageModal = toggleManageModal;
 window.loadSongsForManage = loadSongsForManage;
 window.loadAlbumsForManage = loadAlbumsForManage;
 window.saveSongChanges = saveSongChanges;
 window.deleteSong = deleteSong;
 window.deleteSongBackground = deleteSongBackground;
 window.toggleAlbums = toggleAlbums;
 window.playRainLoop = playRainLoop;
 window.toggleBackgroundModal = toggleBackgroundModal;
 window.saveBackground = saveBackground;
 window.loadAlbumsForBackground = loadAlbumsForBackground;

 function setBackground(data) {
   const bgVideo = document.getElementById('background-video');
   if (bgVideo) {
     const backgroundUrl = data.backgroundVideo || currentAlbumBackground;
     if (bgVideo.src !== backgroundUrl) {
       bgVideo.src = backgroundUrl;
       bgVideo.load();
       bgVideo.play();
     }
   }
 }

 function playCurrentSong() {
   const data = currentSongList[currentIndex];
   setBackground(data);
   const audio = document.getElementById('audio');
   if (audio) {
     audio.src = data.url;
     const songNameElement = document.getElementById('song-name');
     if (songNameElement) {
       songNameElement.style.display = 'block';
       songNameElement.textContent = data.name.replace('.mp3', '');
       if (data.name.includes('黄昏-周传雄') || data.albumName === 'Nhạc Trung') {
         songNameElement.style.fontFamily = "'Ma Shan Zheng', sans-serif";
       } else {
         songNameElement.style.fontFamily = "'Shalimar', cursive";
       }
     }
     const playBtn = document.getElementById('play-btn');
     if (playBtn) {
       playBtn.style.display = 'none';
     }
     const controls = document.getElementById('controls');
     if (controls) {
       controls.style.display = 'block';
     }
     const allP = document.querySelectorAll('#audio-items p');
     allP.forEach(p => p.classList.remove('playing'));
     audio.play().then(() => {
       const playPauseBtn = document.getElementById('play-pause-btn');
       if (playPauseBtn) {
         playPauseBtn.textContent = '❚❚';
       }
       const currentP = document.querySelector(`#audio-items p[data-index="${currentIndex}"]`);
       if (currentP) currentP.classList.add('playing');
     }).catch((e) => {
       console.error('Autoplay blocked: ' + e.message);
       const playPauseBtn = document.getElementById('play-pause-btn');
       if (playPauseBtn) {
         playPauseBtn.textContent = '▶';
       }
     });
   }
 }
 
 function formatTime(seconds) {
   const min = Math.floor(seconds / 60);
   const sec = Math.floor(seconds % 60);
   return `${min}:${sec.toString().padStart(2, '0')}`;
 }

 window.onload = async function() {
   // Load albums and album list
   loadAlbums();
   if (!isAlbumsLoaded) {
     await loadAlbumList();
     isAlbumsLoaded = true;
   }

   // Set up event handlers for controls
   document.getElementById('prev-btn').onclick = () => {
     if (currentIndex > 0) {
       currentIndex--;
     } else {
       currentIndex = currentSongList.length - 1;
     }
     playCurrentSong();
   };
   document.getElementById('next-btn').onclick = () => {
     if (currentIndex < currentSongList.length - 1) {
       currentIndex++;
     } else {
       currentIndex = 0;
     }
     playCurrentSong();
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
   document.getElementById('repeat-btn').onclick = () => {
     isRepeatMode = !isRepeatMode;
     if (isRepeatMode) {
       document.getElementById('repeat-btn').style.color = 'orange';
       document.getElementById('repeat-btn').style.fontWeight = 'bold';
     } else {
       document.getElementById('repeat-btn').style.color = '';
       document.getElementById('repeat-btn').style.fontWeight = 'normal';
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
     if (isRepeatMode) {
       const audio = document.getElementById('audio');
       audio.currentTime = 0;
       audio.play();
     } else {
       if (currentIndex < currentSongList.length - 1) {
         currentIndex++;
       } else {
         currentIndex = 0;
       }
       playCurrentSong();
     }
   };
 };