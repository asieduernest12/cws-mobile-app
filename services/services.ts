// app/services/regionService.ts

import { API_BASE_URL } from "@/config/api";
import axios from "axios";

export interface Region {
  id: number;
  name: string;
}

export interface Constituency {
  id: number;
  name: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  constituency: Constituency | null;
  area: string;
  region: Region | null;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface CampaignMessage {
  id: string;
  title: string;
  content: string;
  user: {
    name: string;
  };
  likes_count: number;
  shares_count: number;
  reads: number;
  shareable_url: string;
}

export const fetchRegions = async (): Promise<Region[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/regions`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching regions:", error);
    throw error;
  }
};

export const fetchConstituencies = async (
  regionId: number
): Promise<Constituency[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/regions/${regionId}/constituencies`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching constituencies:", error);
    throw error;
  }
};

export const fetchCampaignMessages = async (
  token: string
): Promise<CampaignMessage[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/campaign-messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching campaign messages:", error);
    throw error;
  }
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error response:", error.response);
      console.error("Error request:", error.request);
      console.error("Error config:", error.config);
    }
    throw error;
  }
};