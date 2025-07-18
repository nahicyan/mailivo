"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactService = void 0;
// app/src/services/contact.service.ts
const api_1 = require("@/lib/api");
exports.contactService = {
    async list(params) {
        const { data } = await api_1.api.get('/contacts', { params });
        return data;
    },
    async create(contact) {
        const { data } = await api_1.api.post('/contacts', contact);
        return data;
    },
    async importContacts(file) {
        const { data } = await api_1.api.post('/contacts/import', file, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async getSegments() {
        const { data } = await api_1.api.get('/contacts/segments');
        return data;
    }
};
