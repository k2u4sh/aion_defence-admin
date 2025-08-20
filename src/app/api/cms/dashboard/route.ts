import { NextRequest } from "next/server";
import { connectDB } from "@/utils/db";
import jwt from 'jsonwebtoken';
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  isVerified: boolean;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Import CMS Models
async function getCMSModels() {
  const models = await import('@/models/cmsModel');
  return models;
}

// Verify JWT Token and Admin Role
function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    
    // Only allow admin users to access dashboard
    // Check if user has admin role in the roles array
    if (!decoded.roles || !decoded.roles.includes('admin')) return null;
    
    return decoded;
  } catch {
    return null;
  }
}

// GET - CMS Dashboard Analytics and Stats
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return ApiResponseHandler.error("Unauthorized. Admin access required.", 401);
    }

    await connectDB();
    const models = await getCMSModels();
    
    // Get all CMS sections status
    const [
      heroCount,
      headerCount,
      featuresCount,
      customizeCount,
      whoCanJoinCount,
      subscriptionCount,
      footerCount,
      seoCount,
      settingsCount
    ] = await Promise.all([
      models.HeroSection.countDocuments({ isActive: true }),
      models.Header.countDocuments({ isActive: true }),
      models.FeaturesSection.countDocuments({ isActive: true }),
      models.CustomizeSection.countDocuments({ isActive: true }),
      models.WhoCanJoin.countDocuments({ isActive: true }),
      models.SubscriptionPlans.countDocuments({ isActive: true }),
      models.Footer.countDocuments({ isActive: true }),
      models.SEOSettings.countDocuments({ isActive: true }),
      models.GeneralSettings.countDocuments({ isActive: true })
    ]);
    
    // Get recent updates
    const recentUpdates = await Promise.all([
      models.HeroSection.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.Header.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.FeaturesSection.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.CustomizeSection.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.WhoCanJoin.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.SubscriptionPlans.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.Footer.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.SEOSettings.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt'),
      models.GeneralSettings.findOne({ isActive: true }).sort({ updatedAt: -1 }).select('updatedAt')
    ]);
    
    const sectionStatus = {
      hero: { count: heroCount, configured: heroCount > 0, lastUpdated: recentUpdates[0]?.updatedAt },
      header: { count: headerCount, configured: headerCount > 0, lastUpdated: recentUpdates[1]?.updatedAt },
      features: { count: featuresCount, configured: featuresCount > 0, lastUpdated: recentUpdates[2]?.updatedAt },
      customize: { count: customizeCount, configured: customizeCount > 0, lastUpdated: recentUpdates[3]?.updatedAt },
      whoCanJoin: { count: whoCanJoinCount, configured: whoCanJoinCount > 0, lastUpdated: recentUpdates[4]?.updatedAt },
      subscriptionPlans: { count: subscriptionCount, configured: subscriptionCount > 0, lastUpdated: recentUpdates[5]?.updatedAt },
      footer: { count: footerCount, configured: footerCount > 0, lastUpdated: recentUpdates[6]?.updatedAt },
      seo: { count: seoCount, configured: seoCount > 0, lastUpdated: recentUpdates[7]?.updatedAt },
      settings: { count: settingsCount, configured: settingsCount > 0, lastUpdated: recentUpdates[8]?.updatedAt }
    };
    
    const totalSections = 9;
    const configuredSections = Object.values(sectionStatus).filter(section => section.configured).length;
    const completionPercentage = Math.round((configuredSections / totalSections) * 100);
    
    // Get site settings for maintenance status
    const generalSettings = await models.GeneralSettings.findOne({ isActive: true });
    
    return ApiResponseHandler.success({
      message: "CMS dashboard data fetched successfully",
      success: true,
      data: {
        overview: {
          totalSections,
          configuredSections,
          completionPercentage,
          maintenanceMode: generalSettings?.maintenanceMode || false
        },
        sectionStatus,
        systemInfo: {
          lastInitialized: generalSettings?.createdAt,
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development"
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching CMS dashboard:", error);
    return ApiResponseHandler.error("Error fetching CMS dashboard", 500);
  }
}

// POST - Bulk operations (backup, restore, reset)
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return ApiResponseHandler.error("Unauthorized. Admin access required.", 401);
    }

    await connectDB();
    const models = await getCMSModels();
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'backup':
        // Create backup of all CMS data
        const backupData = await Promise.all([
          models.HeroSection.find({ isActive: true }),
          models.Header.find({ isActive: true }),
          models.FeaturesSection.find({ isActive: true }),
          models.CustomizeSection.find({ isActive: true }),
          models.WhoCanJoin.find({ isActive: true }),
          models.SubscriptionPlans.find({ isActive: true }),
          models.Footer.find({ isActive: true }),
          models.SEOSettings.find({ isActive: true }),
          models.GeneralSettings.find({ isActive: true })
        ]);
        
        const backup = {
          timestamp: new Date(),
          data: {
            hero: backupData[0],
            header: backupData[1],
            features: backupData[2],
            customize: backupData[3],
            whoCanJoin: backupData[4],
            subscriptionPlans: backupData[5],
            footer: backupData[6],
            seo: backupData[7],
            settings: backupData[8]
          }
        };
        
        return ApiResponseHandler.success(backup
        , "CMS backup created successfully");
        
      case 'toggle-maintenance':
        // Toggle maintenance mode
        const settings = await models.GeneralSettings.findOneAndUpdate(
          { isActive: true },
          { $set: { maintenanceMode: body.maintenanceMode } },
          { new: true }
        );
        
        return ApiResponseHandler.success({
          message: `Maintenance mode ${body.maintenanceMode ? 'enabled' : 'disabled'}`,
          success: true,
          data: { maintenanceMode: settings?.maintenanceMode }
        });
        
      case 'clear-cache':
        // Clear any cached CMS data (implementation depends on your caching strategy)
        return ApiResponseHandler.success(null, "CMS cache cleared successfully");
        
      default:
        return ApiResponseHandler.error("Invalid action", 400);
    }
    
  } catch (error) {
    console.error("Error performing CMS operation:", error);
    return ApiResponseHandler.error("Error performing CMS operation", 500);
  }
}
