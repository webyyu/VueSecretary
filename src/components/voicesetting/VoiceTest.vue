<template>
  <div class="voice-test-container">
    <h2>Voice API Test</h2>
    
    <div class="test-section">
      <h3>Upload Voice Sample</h3>
      <div class="file-selector">
        <input type="file" @change="handleFileSelect" accept=".mp3,.wav,.ogg,.m4a" />
      </div>
      <button @click="testUpload" :disabled="!selectedFile">Upload File</button>
      
      <div v-if="uploadStatus" class="status-box" :class="{ 'success': uploadSuccess, 'error': !uploadSuccess }">
        <pre>{{ uploadStatus }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>Get All Voice Files</h3>
      <button @click="testGetAllFiles">Fetch All Files</button>
      
      <div v-if="allFilesStatus" class="status-box" :class="{ 'success': allFilesSuccess, 'error': !allFilesSuccess }">
        <pre>{{ allFilesStatus }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>Get Voice File by ID</h3>
      <div class="input-row">
        <input type="text" v-model="fileIdToGet" placeholder="Enter file ID" />
        <button @click="testGetFileById" :disabled="!fileIdToGet">Fetch File</button>
      </div>
      
      <div v-if="getFileStatus" class="status-box" :class="{ 'success': getFileSuccess, 'error': !getFileSuccess }">
        <pre>{{ getFileStatus }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>Delete Voice File</h3>
      <div class="input-row">
        <input type="text" v-model="fileIdToDelete" placeholder="Enter file ID to delete" />
        <button @click="testDeleteFile" :disabled="!fileIdToDelete">Delete File</button>
      </div>
      
      <div v-if="deleteStatus" class="status-box" :class="{ 'success': deleteSuccess, 'error': !deleteSuccess }">
        <pre>{{ deleteStatus }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadVoiceSample, getAllVoiceFiles, getVoiceFileById, deleteVoiceFile } from '@/api/voice';

// File upload state
const selectedFile = ref(null);
const uploadStatus = ref('');
const uploadSuccess = ref(false);

// Get all files state
const allFilesStatus = ref('');
const allFilesSuccess = ref(false);

// Get file by id state
const fileIdToGet = ref('');
const getFileStatus = ref('');
const getFileSuccess = ref(false);

// Delete file state
const fileIdToDelete = ref('');
const deleteStatus = ref('');
const deleteSuccess = ref(false);

// Handle file selection
const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0];
  console.log('Selected file:', selectedFile.value);
};

// Test file upload
const testUpload = async () => {
  if (!selectedFile.value) {
    uploadStatus.value = 'No file selected';
    uploadSuccess.value = false;
    return;
  }
  
  try {
    uploadStatus.value = 'Uploading file...';
    const result = await uploadVoiceSample(selectedFile.value);
    uploadStatus.value = JSON.stringify(result, null, 2);
    uploadSuccess.value = true;
    
    // Auto-fill the file ID field for get and delete operations
    if (result.data && result.data.fileId) {
      fileIdToGet.value = result.data.fileId;
      fileIdToDelete.value = result.data.fileId;
    }
  } catch (error) {
    uploadSuccess.value = false;
    uploadStatus.value = `Upload failed: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`;
  }
};

// Test get all files
const testGetAllFiles = async () => {
  try {
    allFilesStatus.value = 'Fetching all voice files...';
    const files = await getAllVoiceFiles();
    allFilesStatus.value = JSON.stringify(files, null, 2);
    allFilesSuccess.value = true;
    
    // Populate the first file ID if available
    if (files && files.length > 0) {
      fileIdToGet.value = files[0]._id;
      fileIdToDelete.value = files[0]._id;
    }
  } catch (error) {
    allFilesSuccess.value = false;
    allFilesStatus.value = `Failed to fetch files: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`;
  }
};

// Test get file by ID
const testGetFileById = async () => {
  if (!fileIdToGet.value) {
    getFileStatus.value = 'No file ID provided';
    getFileSuccess.value = false;
    return;
  }
  
  try {
    getFileStatus.value = `Fetching file with ID: ${fileIdToGet.value}...`;
    const file = await getVoiceFileById(fileIdToGet.value);
    getFileStatus.value = JSON.stringify(file, null, 2);
    getFileSuccess.value = true;
  } catch (error) {
    getFileSuccess.value = false;
    getFileStatus.value = `Failed to fetch file: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`;
  }
};

// Test delete file
const testDeleteFile = async () => {
  if (!fileIdToDelete.value) {
    deleteStatus.value = 'No file ID provided';
    deleteSuccess.value = false;
    return;
  }
  
  try {
    deleteStatus.value = `Deleting file with ID: ${fileIdToDelete.value}...`;
    const result = await deleteVoiceFile(fileIdToDelete.value);
    deleteStatus.value = JSON.stringify(result, null, 2);
    deleteSuccess.value = true;
    
    // Clear the file ID fields after successful deletion
    if (fileIdToGet.value === fileIdToDelete.value) {
      fileIdToGet.value = '';
    }
    fileIdToDelete.value = '';
  } catch (error) {
    deleteSuccess.value = false;
    deleteStatus.value = `Failed to delete file: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}`;
  }
};
</script>

<style scoped>
.voice-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #0A84FF;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

h3 {
  margin-top: 0;
  color: #333;
}

button {
  background-color: #0A84FF;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0077e6;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

input[type="text"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.status-box {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.status-box.success {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
}

.status-box.error {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
}

pre {
  margin: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .test-section {
    background-color: #333;
    color: #f5f5f5;
  }
  
  h3 {
    color: #f5f5f5;
  }
  
  input[type="text"] {
    background-color: #444;
    color: #f5f5f5;
    border-color: #555;
  }
}
</style> 