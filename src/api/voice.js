import axios from 'axios';
import { getAuthHeaders } from './auth';
import { API_BASE_URL } from '@/env';

/**
 * Upload audio file to the server
 * @param {File} audioFile - The audio file to upload
 * @returns {Promise<Object>} - Upload response data
 */
export const uploadVoiceSample = async (audioFile) => {
  console.log('🚀 Starting voice sample upload:', audioFile.name);
  
  try {
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    
    console.log('📤 Sending upload request...');
    
    const response = await axios.post(
      `${API_BASE_URL}/voice/upload`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get all voice files for the current user
 * @returns {Promise<Array>} - List of voice files
 */
export const getAllVoiceFiles = async () => {
  console.log('🔍 Fetching all voice files...');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/voice`,
      { headers: getAuthHeaders() }
    );
    
    console.log('✅ Retrieved voice files:', response.data);
    return response.data.data.voices;
  } catch (error) {
    console.error('❌ Failed to fetch voice files:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get a specific voice file by ID
 * @param {string} id - Voice file ID
 * @returns {Promise<Object>} - Voice file details
 */
export const getVoiceFileById = async (id) => {
  console.log(`🔍 Fetching voice file with ID: ${id}`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/voice/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('✅ Retrieved voice file:', response.data);
    return response.data.data.voice;
  } catch (error) {
    console.error('❌ Failed to fetch voice file:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a voice file
 * @param {string} id - Voice file ID to delete
 * @returns {Promise<Object>} - Deletion response
 */
export const deleteVoiceFile = async (id) => {
  console.log(`🗑️ Deleting voice file with ID: ${id}`);
  
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/voice/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('✅ Voice file deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to delete voice file:', error.response?.data || error.message);
    throw error;
  }
}; 