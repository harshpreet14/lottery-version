// Shared utility for fetching memberships across the app (server-side only)

export type WhopUser = {
	id: string;
	name: string;
	username: string;
	email: string;
	profile_pic_url: string | null;
	profile_pic_url_32: string | null;
	profile_pic_url_64: string | null;
	profile_pic_url_128: string | null;
	created_at: string;
};

export type WhopMembership = {
	id: string;
	status: string;
	customer: WhopUser;
	created_at: string;
	updated_at: string;
};

/**
 * Fetch all active members for a given product ID using the Whop REST API.
 * Handles pagination (50 per page) until no results remain.
 */
export async function getAllActiveMembers(productId: string): Promise<WhopMembership[]> {
	const allMembers: WhopMembership[] = [];
	let currentPage = 1;
	let hasMorePages = true;

	while (hasMorePages) {
		// Request to include customer data to avoid extra fetches per membership
		const url = `https://api.whop.com/api/v5/memberships?product_id=${encodeURIComponent(
			productId,
		)}&status=active&page=${currentPage}&per=50&include=customer`;
		const response = await fetch(
			url,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			// Stop on error to avoid infinite loops; caller can decide how to handle
			break;
		}

		const data = (await response.json()) as { data?: WhopMembership[] };
		const pageData = data.data ?? [];

		if (pageData.length > 0) {
			allMembers.push(...pageData);
			currentPage++;
		} else {
			hasMorePages = false;
		}
	}

	return allMembers;
}


