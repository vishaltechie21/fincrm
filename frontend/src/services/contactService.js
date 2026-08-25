import axios from 'axios';

const API_URL = 'http://localhost:5000/api/contacts';

/**
 * Fetch all contacts, optionally filtered by search query.
 */
export const getContacts = async (search = '') => {
  try {
    const res = await axios.get(`${API_URL}?search=${encodeURIComponent(search)}`);
    return res.data;
  } catch (err) {
    console.error('Failed to get contacts:', err);
    throw err;
  }
};

/**
 * Fetch a single contact by ID.
 */
export const getContactById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to get contact ${id}:`, err);
    throw err;
  }
};

/**
 * Create a new contact.
 */
export const createContact = async (contactData) => {
  try {
    const res = await axios.post(API_URL, contactData);
    return res.data;
  } catch (err) {
    console.error('Failed to create contact:', err);
    throw err;
  }
};

/**
 * Update an existing contact.
 */
export const updateContact = async (id, contactData) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, contactData);
    return res.data;
  } catch (err) {
    console.error(`Failed to update contact ${id}:`, err);
    throw err;
  }
};

/**
 * Delete a contact by ID.
 */
export const deleteContact = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to delete contact ${id}:`, err);
    throw err;
  }
};
