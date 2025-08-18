import { NextRequest } from "next/server";
import { connectDB } from "@/utils/db";
import jwt from 'jsonwebtoken';
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
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
    
    // Only allow admin users to manage CMS
    if (decoded.role !== 'admin') return null;
    
    return decoded;
  } catch {
    return null;
  }
}

// GET - Fetch all CMS content or specific section
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const models = await getCMSModels();
    
    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    
    if (section) {
      // Fetch specific section
      let data;
      
      switch (section) {
        case 'hero':
          data = await models.HeroSection.findOne({ isActive: true });
          break;
        case 'header':
          data = await models.Header.findOne({ isActive: true });
          break;
        case 'features':
          data = await models.FeaturesSection.findOne({ isActive: true });
          break;
        case 'customize':
          data = await models.CustomizeSection.findOne({ isActive: true });
          break;
        case 'who-can-join':
          data = await models.WhoCanJoin.findOne({ isActive: true });
          break;
        case 'subscription-plans':
          data = await models.SubscriptionPlans.findOne({ isActive: true });
          break;
        case 'footer':
          data = await models.Footer.findOne({ isActive: true });
          break;
        case 'seo':
          data = await models.SEOSettings.findOne({ isActive: true });
          break;
        case 'settings':
          data = await models.GeneralSettings.findOne({ isActive: true });
          break;
        default:
          return ApiResponseHandler.error("Invalid section", 400);
      }
      
      return ApiResponseHandler.success({
        message: `${section} content fetched successfully`,
        success: true,
        data
      });
    } else {
      // Fetch all CMS content
      const [
        hero,
        header,
        features,
        customize,
        whoCanJoin,
        subscriptionPlans,
        footer,
        seo,
        settings
      ] = await Promise.all([
        models.HeroSection.findOne({ isActive: true }),
        models.Header.findOne({ isActive: true }),
        models.FeaturesSection.findOne({ isActive: true }),
        models.CustomizeSection.findOne({ isActive: true }),
        models.WhoCanJoin.findOne({ isActive: true }),
        models.SubscriptionPlans.findOne({ isActive: true }),
        models.Footer.findOne({ isActive: true }),
        models.SEOSettings.findOne({ isActive: true }),
        models.GeneralSettings.findOne({ isActive: true })
      ]);
      
      return ApiResponseHandler.success({
        message: "All CMS content fetched successfully",
        success: true,
        data: {
          hero,
          header,
          features,
          customize,
          whoCanJoin,
          subscriptionPlans,
          footer,
          seo,
          settings
        }
      });
    }
    
  } catch (error) {
    console.error("Error fetching CMS content:", error);
    return ApiResponseHandler.error("Error fetching CMS content", 500);
  }
}

// (Removed duplicate POST. Use the action-based POST below.)


// POST - Update or Delete specific CMS content (action-based)
// To update: { action: "update", section, id, data }
// To delete: { action: "delete", section, id }
// To create: { section, data } (as before)
// To upsert: { section, data } (as before)
// If no action, default to upsert
// All operations are POST
// Example: { action: "update", section: "hero", id: "...", data: { ... } }
// Example: { action: "delete", section: "hero", id: "..." }

// ...existing code...
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return ApiResponseHandler.error("Unauthorized. Admin access required.", 401);
    }

    await connectDB();
    const models = await getCMSModels();
    
    const body = await request.json();
    const { action, section, id, data } = body;
    
    if (!section) {
      return ApiResponseHandler.error("Section is required", 400);
    }

    let Model;
    switch (section) {
      case 'hero':
        Model = models.HeroSection;
        break;
      case 'header':
        Model = models.Header;
        break;
      case 'features':
        Model = models.FeaturesSection;
        break;
      case 'customize':
        Model = models.CustomizeSection;
        break;
      case 'who-can-join':
        Model = models.WhoCanJoin;
        break;
      case 'subscription-plans':
        Model = models.SubscriptionPlans;
        break;
      case 'footer':
        Model = models.Footer;
        break;
      case 'seo':
        Model = models.SEOSettings;
        break;
      case 'settings':
        Model = models.GeneralSettings;
        break;
      default:
        return ApiResponseHandler.error("Invalid section", 400);
    }

    // Handle update by id
    if (action === 'update') {
      if (!id || !data) {
        return ApiResponseHandler.error("ID and data are required for update", 400);
      }
      const result = await Model.findByIdAndUpdate(
        id,
        { ...data, updatedBy: user.userId },
        { new: true }
      );
      if (!result) {
        return ApiResponseHandler.error("Content not found", 404);
      }
      return ApiResponseHandler.success({
        message: `${section} content updated successfully`,
        success: true,
        data: result
      });
    }

    // Handle delete by id (soft delete)
    if (action === 'delete') {
      if (!id) {
        return ApiResponseHandler.error("ID is required for delete", 400);
      }
      const result = await Model.findByIdAndUpdate(
        id,
        { isActive: false, updatedBy: user.userId },
        { new: true }
      );
      if (!result) {
        return ApiResponseHandler.error("Content not found", 404);
      }
      return ApiResponseHandler.success({
        message: `${section} content deleted successfully`,
        success: true,
        data: result
      });
    }

    // Default: upsert (create or update by isActive)
    if (!data) {
      return ApiResponseHandler.error("Data is required for upsert", 400);
    }
    const result = await Model.findOneAndUpdate(
      { isActive: true },
      { ...data, updatedBy: user.userId },
      { new: true, upsert: true }
    );
    return ApiResponseHandler.success({
      message: `${section} content upserted successfully`,
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error updating CMS content:", error);
    return ApiResponseHandler.error("Error updating CMS content", 500);
  }
}
