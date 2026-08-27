"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndStoreEonetData = void 0;
const axios_1 = __importDefault(require("axios"));
const Disaster_1 = __importDefault(require("../models/Disaster"));
const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const fetchAndStoreEonetData = async () => {
    try {
        const response = await axios_1.default.get(EONET_API_URL, {
            params: { status: 'open', limit: 50 }
        });
        const events = response.data.events;
        for (const event of events) {
            if (!event.geometry || event.geometry.length === 0)
                continue;
            const latestGeo = event.geometry[0];
            const coordinates = {
                lng: latestGeo.coordinates[0],
                lat: latestGeo.coordinates[1]
            };
            await Disaster_1.default.findOneAndUpdate({ eonetId: event.id }, {
                eonetId: event.id,
                title: event.title,
                category: event.categories[0]?.title || 'Unknown',
                status: 'active',
                coordinates,
                date: new Date(latestGeo.date)
            }, { upsert: true, new: true });
        }
        console.log(`Synced ${events.length} events from EONET.`);
    }
    catch (error) {
        console.error('Error fetching EONET data:', error);
    }
};
exports.fetchAndStoreEonetData = fetchAndStoreEonetData;
