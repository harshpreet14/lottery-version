import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { getAllActiveMembers, type WhopMembership } from "@/lib/memberships";

// Define types for the data we'll be working with
type Membership = WhopMembership;

/**
 * Fetches all active members for a given product ID using direct API calls.
 * @param {string} productId - The ID of the Whop product.
 * @returns {Promise<Membership[]>} - A promise that resolves to an array of all active members.
 */
// getAllActiveMembers moved to shared util in `lib/memberships`

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The companyId is a path param
	const { companyId } = await params;

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

	const result = await whopSdk.access.checkIfUserHasAccessToCompany({
		userId,
		companyId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const company = await whopSdk.companies.getCompany({ companyId });

	// Either: 'admin' | 'no_access';
	// 'admin' means the user is an admin of the company, such as an owner or moderator
	// 'no_access' means the user is not an authorized member of the company
	const { accessLevel } = result;

	// Ensure the product ID is available from environment variables.
	const productId = process.env.WHOP_PRODUCT_ID;
	
	let members: Membership[] = [];
	if (productId) {
		// Fetch all members on the server when the page component renders.
		members = await getAllActiveMembers(productId);
	} else {
		console.error("WHOP_PRODUCT_ID is not set in the environment variables.");
	}

	return (
		<main className="flex min-h-screen flex-col items-center p-24">
			<div className="w-full max-w-6xl">
				{/* Header Section */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
					<p className="text-lg text-gray-600">Company ID: {companyId}</p>
					<p className="text-sm text-gray-500">
						Hi <strong>{user.name}</strong>, you{" "}
						<strong>{result.hasAccess ? "have" : "do not have"} access</strong> to
						this company. Your access level: <strong>{accessLevel}</strong>
					</p>
				</div>

				{/* User List Section */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-semibold text-gray-900 mb-6">
						Active App Users ({members.length})
					</h2>
					
					{!productId ? (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-600 font-medium">Configuration Error</p>
							<p className="text-red-500 text-sm mt-1">
								WHOP_PRODUCT_ID is not configured. Unable to fetch users.
							</p>
						</div>
					) : (
						<div className="max-h-96 overflow-y-auto rounded-lg border bg-gray-50 p-4">
							{members.length > 0 ? (
								<div className="grid gap-3">
									{members.map((member) => (
										<div key={member.id} className="bg-white rounded-md border p-4 shadow-sm hover:shadow-md transition-shadow">
											<div className="flex items-center space-x-4">
												{/* Profile Picture */}
												<div className="flex-shrink-0">
													{member.customer.profile_pic_url_64 ? (
														<img
															src={member.customer.profile_pic_url_64}
															alt={`${member.customer.name}'s profile`}
															className="w-12 h-12 rounded-full object-cover"
														/>
													) : (
														<div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
															<span className="text-gray-600 font-medium">
																{member.customer.name?.charAt(0) || '?'}
															</span>
														</div>
													)}
												</div>
												
												{/* User Info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center space-x-2">
														<p className="text-sm font-medium text-gray-900 truncate">
															{member.customer.name || 'No name'}
														</p>
														{member.customer.username && (
															<span className="text-sm text-gray-500">
																@{member.customer.username}
															</span>
														)}
													</div>
													<p className="text-sm text-gray-600 truncate">
														{member.customer.email || 'No email'}
													</p>
													<p className="text-xs text-gray-500">
														Joined: {new Date(member.created_at).toLocaleDateString()}
													</p>
												</div>
												
												{/* Status Badge */}
												<div className="flex-shrink-0">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
														{member.status}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<p className="text-gray-500">No active users found for this product.</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Debug Information (only in development) */}
				{process.env.NODE_ENV === 'development' && (
					<div className="mt-8 bg-gray-100 rounded-lg p-4">
						<h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
						<div className="text-xs text-gray-600 space-y-1">
							<p>User ID: {userId}</p>
							<p>Username: @{user.username}</p>
							<p>Product ID: {productId || 'Not set'}</p>
							<p>Company: {company.title}</p>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
