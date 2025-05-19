import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import RestaurantModel from "@/models/Restaurant";
import OrderModel from "@/models/Order";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a superadmin
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin only." },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch restaurant statistics
    const [totalRestaurants, activeRestaurants, pendingRestaurants] =
      await Promise.all([
        RestaurantModel.countDocuments(),
        RestaurantModel.countDocuments({ isActive: true }),
        RestaurantModel.countDocuments({ isActive: false }),
      ]);

    // Fetch user statistics
    const [totalUsers, customers, riders, restaurantOwners] = await Promise.all(
      [
        UserModel.countDocuments(),
        UserModel.countDocuments({ isCustomer: true }),
        UserModel.countDocuments({ isRider: true }),
        UserModel.countDocuments({ isRestaurantOwner: true }),
      ]
    );

    // Fetch order statistics
    const [totalOrders, completedOrders, pendingOrders, cancelledOrders] =
      await Promise.all([
        OrderModel.countDocuments(),
        OrderModel.countDocuments({ status: "DELIVERED" }),
        OrderModel.countDocuments({
          status: { $in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
        }),
        OrderModel.countDocuments({ status: "CANCELLED" }),
      ]);

    // Calculate total revenue from completed orders
    const completedOrdersData = await OrderModel.find({
      status: "DELIVERED",
    }).select("orderAmount deliveryFee");
    const totalRevenue = completedOrdersData.reduce(
      (sum, order) => sum + order.orderAmount + order.deliveryFee,
      0
    );

    const stats = {
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        pending: pendingRestaurants,
      },
      users: {
        total: totalUsers,
        customers,
        riders,
        restaurantOwners,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        totalRevenue,
      },
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
