// app/services/regionService.ts
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { API_BASE_URL } from '@/api/api';
import axios from 'axios';
import { ParseReturnType, z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/components/AuthProvider';

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
	image_url: string;
	likes_count: number;
	shares_count: number;
	shareable_url: string;
	user: {
		name: string;
	};
	reads: number;
}

export interface PointsData {
	balance: number;
	withdrawalHistory: Array<{
		id: number;
		amount: number;
		status: string;
		created_at: string;
	}>;
}

export interface WithdrawalRequest {
	amount: number;
}

export const buildApiUrl = (params: `/${string}`, baseUrl = API_BASE_URL) => baseUrl + params;

export const fetchRegions = async (): Promise<Region[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/regions`);
		return response.data.data;
	} catch (error) {
		console.error('Error fetching regions:', error);
		throw error;
	}
};

export const fetchConstituencies = async (regionId: number): Promise<Constituency[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/regions/${regionId}/constituencies`);
		return response.data.data;
	} catch (error) {
		console.error('Error fetching constituencies:', error);
		throw error;
	}
};

export const fetchCampaignMessages = async (token: string): Promise<CampaignMessage[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/campaign-messages`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data.data;
	} catch (error) {
		console.error('Error fetching campaign messages:', error);
		throw error;
	}
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/user-profile`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log(response.data);
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error('Error response:', error.response);
			console.error('Error request:', error.request);
			console.error('Error config:', error.config);
		}
		throw error;
	}
};

export const fetchPointsData = async (token: string): Promise<PointsData> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/points`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const data = response.data;

		// Define the type for withdrawal history items
		interface WithdrawalHistoryItem {
			id: number;
			amount: number;
			status: string;
			created_at: string;
		}

		// Validate and sanitize the data
		const sanitizedData: PointsData = {
			balance: typeof data.balance === 'number' ? data.balance : 0,
			withdrawalHistory: Array.isArray(data.withdrawalHistory)
				? data.withdrawalHistory.map((item: WithdrawalHistoryItem) => ({
						id: item.id || 0,
						amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
						status: item.status || 'Unknown',
						created_at: item.created_at || new Date().toISOString(),
				  }))
				: [],
		};

		return sanitizedData;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 404) {
				console.error('Points endpoint not found. The API might not be implemented yet.');
				throw new Error('Points feature is not available at the moment. Please try again later.');
			} else {
				console.error('Error fetching points data:', error.message);
				throw new Error(`Failed to fetch points data: ${error.message}`);
			}
		} else {
			console.error('Unexpected error:', error);
			throw new Error('An unexpected error occurred while fetching points data');
		}
	}
};

export const fetchWithdrawalRequests = async (token: string): Promise<WithdrawalRequest[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/reward-withdrawals`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data.data;
	} catch (error) {
		console.error('Error fetching withdrawal requests:', error);
		throw error;
	}
};

export const updateWithdrawalStatus = async (token: string, withdrawalId: number, status: 'approved' | 'rejected', rejectionReason?: string): Promise<void> => {
	try {
		await axios.put(
			`${API_BASE_URL}/reward-withdrawals/${withdrawalId}`,
			{ status, rejection_reason: rejectionReason },
			{ headers: { Authorization: `Bearer ${token}` } }
		);
	} catch (error) {
		console.error('Error updating withdrawal status:', error);
		throw error;
	}
};

export const submitWithdrawalRequest = async (token: string, amount: number): Promise<void> => {
	try {
		await axios.post(`${API_BASE_URL}/reward-withdrawals`, { amount }, { headers: { Authorization: `Bearer ${token}` } });
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error('Error submitting withdrawal request:', error.message);
			throw new Error(`Failed to submit withdrawal request: ${error.message}`);
		} else {
			console.error('Unexpected error:', error);
			throw new Error('An unexpected error occurred while submitting the withdrawal request');
		}
	}
};

export const fetchUserBalance = async (token: string): Promise<number> => {
	try {
		console.log('Fetching user balance with token:', token);
		const response = await axios.get(`${API_BASE_URL}/user-balance`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log('User balance response:', response.data);
		return response.data.balance;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error('Error fetching user balance:', error.response?.status, error.response?.data);
		} else {
			console.error('Unexpected error:', error);
		}
		throw error;
	}
};

const zPointTransaction = z.object({
	userId: z.string(),
	messageId: z.string(),
	points: z.number().optional(),
});

export type SWROptions = Parameters<typeof useSWR>['2'];

export const useMxPointTransaction = (data: typeof zPointTransaction._type, options?: SWROptions) => {
	const axios = useAxios();
	const req = useSWR(
		{ url: 'point-transactions', data },
		({ url, data }) => {
			console.log({ data });
			const _data = zPointTransaction
				.transform((d) => ({
					point: d.points, //'required|integer',
					transaction_type: 'read_message', //'required|string',
					related_id: d.messageId, //'nullable|integer',
					related_type: 'campaign_message', //'nullable|string',
					user_id: d.userId,
				}))
				.parse(data);

			return axios()
				.post(buildApiUrl(`/point-transactions`), _data)
				.then((r) => r.data);
		},
		options
	);
	return req;
};

export const useAxios = () => {
	const auth = useAuthContext();

	return (tokenize = true) => {
		const axiosInstance = axios.create({
			headers: tokenize ? { Authorization: `Bearer ${auth.token}` } : {},
		});

		return axiosInstance;
	};
};
