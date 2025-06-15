// Document Upload Functionality
import { handleError, handleFirebaseError } from './error-handler.js';
import { storage, showError } from './firebase.js';

let uploadedFiles = [];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function handleFileSelect(event) {
  const files = event.target.files;
  const uploadContainer = document.getElementById('uploadedFiles');

  if (!uploadContainer) {
    handleError(new Error('Upload container not found'), 'handleFileSelect');
    return;
  }

  for (let file of files) {
    if (file.size > MAX_FILE_SIZE) {
      showNotification(`File too large: ${file.name}. Maximum size is 5MB.`, 'error');
      continue;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      showNotification(
        `Invalid file type: ${file.name}. Allowed types: PDF, JPG, PNG, DOC`,
        'error'
      );
      continue;
    }

    uploadedFiles.push(file);
    displayFile(file);
  }
}

function displayFile(file) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.id = `file-${file.name.replace(/[^a-z0-9]/gi, '_')}`;

  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-info';

  const icon = document.createElement('i');
  icon.className = file.type.startsWith('image/') ? 'fas fa-image' : 'fas fa-file-alt';

  const name = document.createElement('span');
  name.textContent = file.name;

  const size = document.createElement('span');
  size.className = 'file-size';
  size.textContent = formatFileSize(file.size);

  const progressBar = document.createElement('div');
  progressBar.className = 'upload-progress';
  progressBar.style.display = 'none';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-file';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.onclick = () => removeFile(file);

  fileInfo.appendChild(icon);
  fileInfo.appendChild(name);
  fileInfo.appendChild(size);
  fileItem.appendChild(fileInfo);
  fileItem.appendChild(progressBar);
  fileItem.appendChild(removeBtn);

  document.getElementById('uploadedFiles').appendChild(fileItem);
}

function removeFile(file) {
  uploadedFiles = uploadedFiles.filter(f => f !== file);
  const fileElement = document.getElementById(`file-${file.name.replace(/[^a-z0-9]/gi, '_')}`);
  if (fileElement) {
    fileElement.remove();
  }
}

async function uploadFiles(userId) {
  if (!userId) {
    throw new Error('User ID is required for file upload');
  }

  const fileUrls = [];
  const storageRef = storage.ref();
  const uploadPromises = [];

  for (let file of uploadedFiles) {
    const fileRef = storageRef.child(`service-requests/${userId}/${Date.now()}-${file.name}`);

    const progressBar = document.querySelector(
      `#file-${file.name.replace(/[^a-z0-9]/gi, '_')} .upload-progress`
    );
    if (progressBar) {
      progressBar.style.display = 'block';
    }

    const uploadTask = fileRef.put(file);

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }
      },
      error => {
        handleFirebaseError(error);
        if (progressBar) {
          progressBar.style.display = 'none';
        }
      }
    );

    uploadPromises.push(
      uploadTask.then(async snapshot => {
        const url = await snapshot.ref.getDownloadURL();
        fileUrls.push({
          name: file.name,
          url: url,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      })
    );
  }

  try {
    await Promise.all(uploadPromises);
    return fileUrls;
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Export functions for use in other files
window.handleFileSelect = handleFileSelect;
window.uploadFiles = uploadFiles;
window.removeFile = removeFile;
