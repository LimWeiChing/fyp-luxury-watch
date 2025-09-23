// 1. IMPORTS - Keep these at the very top
const express = require("express");
const cors = require("cors");
const { Client } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

// 2. LOAD ENVIRONMENT VARIABLES - Second
require("dotenv").config();

// 3. EXPRESS APP SETUP - Third
const app = express();
const PORT = process.env.PORT || 5000;

// 4. API KEYS - Fourth
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.PINATA_JWT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 5. DATABASE CLIENT SETUP - Fifth (MUST come before any client usage)
let client;

if (process.env.DATABASE_URL) {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
  console.log("Using production database connection");
} else {
  client = new Client({
    user: "postgres",
    host: "localhost",
    database: "fyp",
    password: "Admin-123",
    port: 5432,
  });
  console.log("Using local database connection");
}

// 6. DATABASE CONNECTION - Sixth
client
  .connect()
  .then(async () => {
    console.log("Connected to PostgreSQL database successfully");
    console.log("Environment:", process.env.NODE_ENV || "development");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    if (!process.env.DATABASE_URL) {
      console.error(
        "Make sure PostgreSQL is running and database 'fyp' exists"
      );
    }
  });

// 7. MIDDLEWARE - Seventh
app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
app.use(
  "/file",
  (req, res, next) => {
    console.log(`File request: ${req.path}`);
    next();
  },
  express.static(path.join(__dirname, "public/uploads"), {
    setHeaders: (res, path, stat) => {
      console.log(`Serving file: ${path}`);
      res.set("Cache-Control", "public, max-age=3600");
    },
  })
);
app.get("/debug/files", (req, res) => {
  const uploadDir = path.join(__dirname, "public/uploads");

  const getDirectoryContents = (dir) => {
    try {
      if (!fs.existsSync(dir)) return { exists: false, files: [] };
      const files = fs.readdirSync(dir);
      return {
        exists: true,
        files: files.map((file) => ({
          name: file,
          size: fs.statSync(path.join(dir, file)).size,
          fullPath: `/file/${path.relative(uploadDir, path.join(dir, file))}`,
        })),
      };
    } catch (error) {
      return { exists: false, error: error.message, files: [] };
    }
  };

  const directories = {
    profile: getDirectoryContents(path.join(uploadDir, "profile")),
    "raw-material": getDirectoryContents(path.join(uploadDir, "raw-material")),
    component: getDirectoryContents(path.join(uploadDir, "component")),
    watch: getDirectoryContents(path.join(uploadDir, "watch")),
    certifier: getDirectoryContents(path.join(uploadDir, "certifier")),
  };

  res.json({
    uploadDirectory: uploadDir,
    directories: directories,
    totalFiles: Object.values(directories).reduce(
      (sum, dir) => sum + dir.files.length,
      0
    ),
    testUrls: [
      `${req.protocol}://${req.get("host")}/file/profile/admin.png`,
      `${req.protocol}://${req.get(
        "host"
      )}/file/profile/1755713914484-supplier.png`,
    ],
  });
});
// =============================================================================
// ENHANCED PINATA FUNCTIONS WITH ERROR HANDLING
// =============================================================================

app.get("/test-env", (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasApiKeys: {
      pinataApiKey: !!process.env.PINATA_API_KEY,
      pinataSecret: !!process.env.PINATA_SECRET_API_KEY,
      pinataJwt: !!process.env.PINATA_JWT,
      geminiKey: !!process.env.GEMINI_API_KEY,
    },
    corsOrigins: process.env.CORS_ORIGINS,
    databaseUrl: process.env.DATABASE_URL ? "SET" : "NOT SET",
  });
});
/**
 * Test Pinata connection with new credentials
 */
const testPinataConnection = async () => {
  try {
    console.log("Testing Pinata connection with new credentials...");

    const response = await axios.get(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        timeout: 10000,
      }
    );

    console.log("✅ Pinata connection successful:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Pinata connection failed:", error.message);

    // Try with API key method as fallback
    try {
      const fallbackResponse = await axios.get(
        "https://api.pinata.cloud/data/testAuthentication",
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
          timeout: 10000,
        }
      );

      console.log(
        "✅ Pinata connection successful with API key fallback:",
        fallbackResponse.data
      );
      return { success: true, data: fallbackResponse.data, method: "api_key" };
    } catch (fallbackError) {
      console.error("❌ Both authentication methods failed");
      return {
        success: false,
        error: fallbackError.response?.data || fallbackError.message,
        status: fallbackError.response?.status,
      };
    }
  }
};

/**
 * Upload image to Pinata IPFS with new credentials
 */
const uploadImageToPinata = async (imagePath) => {
  try {
    const FormData = require("form-data");
    const fullPath = path.join(__dirname, "public/uploads/watch", imagePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const data = new FormData();
    data.append("file", fs.createReadStream(fullPath));
    data.append(
      "pinataMetadata",
      JSON.stringify({
        name: `watch-image-${Date.now()}.jpg`,
        keyvalues: {
          type: "watch-image",
          uploadDate: new Date().toISOString(),
          source: "luxury-watch-nft",
        },
      })
    );
    data.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 0,
      })
    );

    console.log("FIXED: Uploading image to Pinata IPFS...");

    // Try JWT authentication first
    let response;
    try {
      response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            ...data.getHeaders(),
          },
          timeout: 60000,
        }
      );
    } catch (jwtError) {
      console.warn("FIXED: JWT failed, trying API key method...");

      // Fallback to API key authentication
      response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
            ...data.getHeaders(),
          },
          timeout: 60000,
        }
      );
    }

    console.log(
      "FIXED: Image uploaded to IPFS successfully:",
      response.data.IpfsHash
    );
    return response.data.IpfsHash;
  } catch (error) {
    console.error("FIXED: Error uploading image to IPFS:", error.message);
    console.error("Response data:", error.response?.data);
    throw error;
  }
};

const uploadMetadataToPinata = async (metadata) => {
  try {
    console.log("FIXED: Uploading metadata to Pinata IPFS...");

    // Try JWT authentication first
    let response;
    try {
      response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
    } catch (jwtError) {
      console.warn("FIXED: JWT failed for metadata, trying API key method...");

      // Fallback to API key authentication
      response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
    }

    console.log(
      "FIXED: Metadata uploaded to IPFS successfully:",
      response.data.IpfsHash
    );
    return response.data.IpfsHash;
  } catch (error) {
    console.error("FIXED: Error uploading metadata to IPFS:", error.message);
    console.error("Response data:", error.response?.data);
    throw error;
  }
};

/**
 * Enhanced NFT metadata generation with working IPFS
 */
const generateWatchNFTMetadata = async (watchData) => {
  try {
    console.log(
      "FIXED: Generating NFT metadata with enhanced image handling:",
      watchData.watchId
    );

    // CRITICAL FIX: Enhanced image validation before processing
    if (!watchData.image || watchData.image.trim() === "") {
      throw new Error("No valid image provided for NFT generation");
    }

    const imagePath = path.join(
      __dirname,
      "public/uploads/watch",
      watchData.image
    );
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log("FIXED: Image validation passed for NFT generation");

    // Get component details
    const componentDetails = [];
    for (const componentId of watchData.componentIds) {
      try {
        const componentResult = await client.query(
          `SELECT c.*, rm.material_type, rm.origin, rm.supplier_address
           FROM components c
           LEFT JOIN raw_materials rm ON c.raw_material_id = rm.component_id
           WHERE c.component_id = $1`,
          [componentId]
        );

        if (componentResult.rows.length > 0) {
          componentDetails.push(componentResult.rows[0]);
        }
      } catch (error) {
        console.error(`FIXED: Error fetching component ${componentId}:`, error);
      }
    }

    // FIXED: Enhanced IPFS upload with better error handling
    let imageIpfsHash;
    let imageURI;

    try {
      console.log("FIXED: Attempting IPFS upload for image:", watchData.image);
      imageIpfsHash = await uploadImageToPinata(watchData.image);
      imageURI = `ipfs://${imageIpfsHash}`;
      console.log("FIXED: IPFS upload successful:", imageURI);
    } catch (imageError) {
      console.warn(
        "FIXED: IPFS image upload failed, using local fallback:",
        imageError.message
      );
      imageIpfsHash = `LOCAL_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      imageURI = `http://localhost:5000/file/watch/${watchData.image}`;
    }

    // Generate comprehensive metadata
    const metadata = {
      name: `Luxury Watch NFT - ${watchData.watchId}`,
      description: `Certified luxury timepiece with full supply chain traceability. Assembled on ${
        new Date().toISOString().split("T")[0]
      } with ${componentDetails.length} certified components.`,
      image: imageURI, // FIXED: Use determined image URI
      external_url: `https://yourapp.com/watch/${watchData.watchId}`,
      animation_url: null,

      // Standard NFT attributes
      attributes: [
        {
          trait_type: "Watch ID",
          value: watchData.watchId,
        },
        {
          trait_type: "Assembly Date",
          value: new Date().toISOString().split("T")[0],
        },
        {
          trait_type: "Total Components",
          value: componentDetails.length,
          display_type: "number",
        },
        {
          trait_type: "Assembly Location",
          value: watchData.location || "Manufacturing Facility",
        },
        {
          trait_type: "Assembler Address",
          value: watchData.assemblerAddress,
        },
        {
          trait_type: "Blockchain Network",
          value: "Ethereum",
        },
        {
          trait_type: "Supply Chain Verified",
          value: "Yes",
        },
        {
          trait_type: "IPFS Storage",
          value: imageIpfsHash.startsWith("LOCAL_")
            ? "Local Fallback"
            : "Pinata IPFS",
        },
      ],

      // Extended supply chain data
      supply_chain: {
        components: componentDetails.map((comp) => ({
          component_id: comp.component_id,
          component_type: comp.component_type,
          serial_number: comp.serial_number,
          manufacturer: comp.manufacturer_address,
          material_type: comp.material_type,
          origin: comp.origin,
          certification_status:
            comp.status === "1" ? "Certified" : "Not Certified",
          raw_material_id: comp.raw_material_id,
        })),
        assembly: {
          assembler: watchData.assemblerAddress,
          location: watchData.location,
          timestamp: watchData.timestamp,
          quality_assured: true,
        },
      },

      // Technical specifications
      specifications: {
        movement_type: "Mechanical/Automatic",
        case_material: "Stainless Steel",
        crystal: "Sapphire Crystal",
        water_resistance: "100m",
        power_reserve: "48 hours",
      },

      // Blockchain provenance
      provenance: {
        blockchain: "Ethereum",
        contract_address: "To be filled by frontend",
        token_standard: "ERC-721",
        minted_by: watchData.assemblerAddress,
        minting_timestamp: new Date().toISOString(),
        storage_provider: imageIpfsHash.startsWith("LOCAL_")
          ? "Local with IPFS Fallback"
          : "Pinata IPFS",
      },
    };

    // Upload metadata to IPFS
    let metadataIpfsHash;
    let metadataURI;

    try {
      metadataIpfsHash = await uploadMetadataToPinata(metadata);
      metadataURI = `ipfs://${metadataIpfsHash}`;
      console.log("FIXED: Metadata uploaded to IPFS:", metadataURI);
    } catch (metadataError) {
      console.warn("FIXED: IPFS metadata upload failed, using local fallback");

      // Save metadata locally as backup
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      metadataIpfsHash = `LOCAL_META_${timestamp}_${random}`;
      metadataURI = `http://localhost:5000/local-metadata/${metadataIpfsHash}`;

      const metadataDir = path.join(__dirname, "local_metadata");
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
      }

      const metadataPath = path.join(metadataDir, `${metadataIpfsHash}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }

    console.log("FIXED: NFT metadata generation completed successfully");

    return {
      metadataURI: metadataURI,
      imageURI: imageURI,
      metadata: metadata,
      ipfsHashes: {
        metadata: metadataIpfsHash,
        image: imageIpfsHash,
      },
      isLocalFallback:
        metadataIpfsHash.startsWith("LOCAL_") ||
        imageIpfsHash.startsWith("LOCAL_"),
      storageProvider: metadataIpfsHash.startsWith("LOCAL_")
        ? "Local with IPFS Fallback"
        : "Pinata IPFS",
    };
  } catch (error) {
    console.error("FIXED: Error generating NFT metadata:", error);
    throw error;
  }
};

// =============================================================================
// LOCAL METADATA SERVING ENDPOINT
// =============================================================================

app.get("/local-metadata/:hash", (req, res) => {
  const { hash } = req.params;

  try {
    const metadataPath = path.join(__dirname, "local_metadata", `${hash}.json`);

    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      res.json(metadata);
    } else {
      res.status(404).json({ error: "Local metadata not found" });
    }
  } catch (error) {
    console.error("Error serving local metadata:", error);
    res.status(500).json({ error: "Error reading local metadata" });
  }
});

// =============================================================================
// PINATA CONNECTION TEST ENDPOINT
// =============================================================================

app.get("/test-pinata", async (req, res) => {
  try {
    const result = await testPinataConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/test-ipfs-upload", async (req, res) => {
  try {
    // Test with a small JSON upload
    const testData = {
      test: true,
      message: "Test upload from luxury watch NFT system",
      timestamp: new Date().toISOString(),
      credentials: "updated",
    };

    const result = await uploadMetadataToPinata(testData);

    res.json({
      success: true,
      message: "IPFS upload test successful",
      ipfsHash: result,
      ipfsUrl: `ipfs://${result}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "IPFS upload test failed",
      error: error.message,
    });
  }
});

// =============================================================================
// ENHANCED TIMESTAMP UTILITIES
// =============================================================================
// FIXED: Enhanced timestamp parsing with better format detection
const parseTimestamp = (timestamp, inputType = "auto") => {
  if (!timestamp) {
    console.log("FIXED: No timestamp provided, using current time");
    return new Date().toISOString();
  }

  try {
    console.log("FIXED: Parsing timestamp:", {
      input: timestamp,
      type: inputType,
    });

    // Auto-detect timestamp type if not specified
    if (inputType === "auto") {
      const timestampStr = timestamp.toString().trim();

      // Check for Unix timestamp (10 or 13 digits)
      const numTimestamp = parseInt(timestampStr);
      if (!isNaN(numTimestamp) && timestampStr === numTimestamp.toString()) {
        if (timestampStr.length === 10 || timestampStr.length === 13) {
          inputType = "unix";
        }
      }
      // Check for ISO format (contains T and timezone info)
      else if (
        timestampStr.includes("T") &&
        (timestampStr.includes("Z") ||
          timestampStr.includes("+") ||
          timestampStr.includes("-"))
      ) {
        inputType = "iso";
      }
      // Check for database format (YYYY-MM-DD HH:mm:ss)
      else if (timestampStr.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)) {
        inputType = "database";
      } else {
        inputType = "locale";
      }

      console.log("FIXED: Auto-detected type:", inputType);
    }

    let date;
    switch (inputType) {
      case "unix":
        const timestampMs =
          timestamp.toString().length === 10
            ? parseInt(timestamp) * 1000
            : parseInt(timestamp);
        date = new Date(timestampMs);
        break;

      case "iso":
        date = new Date(timestamp);
        break;

      case "database":
        date = new Date(timestamp);
        break;

      case "locale":
      default:
        date = new Date(timestamp);
        break;
    }

    const result = date.toISOString();
    console.log("FIXED: Parsed result:", {
      input: timestamp,
      type: inputType,
      output: result,
      isValid: !isNaN(date.getTime()),
    });

    return !isNaN(date.getTime()) ? result : new Date().toISOString();
  } catch (error) {
    console.warn("FIXED: Error parsing timestamp:", error, "from:", timestamp);
    return new Date().toISOString();
  }
};
// =============================================================================
// GEMINI AI ANALYSIS CONFIGURATION
// =============================================================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Convert image to base64
const convertImageToBase64 = async (imagePath) => {
  try {
    const fullPath = path.join(__dirname, "public/uploads/watch", imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString("base64");
    return base64Image;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image");
  }
};

// Generate dynamic month range for the last 12 months
const generateMonthRange = () => {
  const currentDate = new Date();
  const months = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Start from 11 months ago to current month
  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    months.push(`${monthName}-${year}`);
  }

  return {
    months,
    startMonth: months[0],
    endMonth: months[11],
  };
};

// Enhanced AI analysis with monthly price tracking and trend analysis
const analyzeWatchWithAI = async (base64Image) => {
  try {
    console.log("Starting AI analysis with Gemini...");

    // Generate dynamic month range
    const { months, startMonth, endMonth } = generateMonthRange();
    console.log(`Month range: ${startMonth} to ${endMonth}`);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this luxury watch image and provide ONLY the following information in this exact format:

WATCH_MODEL: [Provide ONE specific watch model name with brand, model, and reference number if visible. Be as specific as possible. For example: "Rolex Submariner Date 126610LN" or "Omega Speedmaster Professional Moonwatch 310.30.42.50.01.001"]

MONTHLY_PRICES: [Provide exactly 12 monthly price values from ${startMonth} to ${endMonth}, separated by commas. Each price should be a number only (no $ symbol, no commas). The last price (month 12) should be the current market price. For example: 8200,8150,8300,8450,8500,8400,8600,8750,8800,8650,8700,8500]

Important: 
- Use exactly the format "WATCH_MODEL:" and "MONTHLY_PRICES:" (with colons)
- Give only ONE answer for each item
- For watch model, be as specific as possible including brand, model name, and reference number if identifiable
- For monthly prices, provide exactly 12 numbers representing monthly prices from ${startMonth} to ${endMonth}
- Each month price should be realistic market values for this luxury watch
- The 12th price (current month) is the current market price
- If you cannot identify the specific model, provide the closest identifiable luxury watch model`,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0]
    ) {
      const analysisText = response.data.candidates[0].content.parts[0].text;
      console.log("Raw AI Response:", analysisText);

      // Enhanced parsing
      let watchModel = null;
      let monthlyPrices = [];

      // Parse watch model
      const watchModelMatch = analysisText.match(
        /WATCH_MODEL:\s*(.+?)(?:\n|$)/i
      );
      if (watchModelMatch) {
        watchModel = watchModelMatch[1].trim();
      }

      // Parse monthly prices
      const pricesMatch = analysisText.match(
        /MONTHLY_PRICES:\s*(.+?)(?:\n|$)/i
      );
      if (pricesMatch) {
        const pricesString = pricesMatch[1].trim();
        monthlyPrices = pricesString.split(",").map((price) => {
          const numPrice = parseInt(price.trim());
          return isNaN(numPrice) ? 0 : numPrice;
        });

        // Ensure we have exactly 12 prices
        while (monthlyPrices.length < 12) {
          monthlyPrices.push(0);
        }
        monthlyPrices = monthlyPrices.slice(0, 12);
      }

      // Fallback parsing if new format not found
      if (!watchModel || monthlyPrices.length === 0) {
        console.log("Using fallback parsing...");
        const lines = analysisText.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          const lowerLine = line.toLowerCase();

          if (
            !watchModel &&
            (lowerLine.includes("watch model:") || lowerLine.includes("1."))
          ) {
            watchModel = line.replace(/^.*?[:]\s*/i, "").trim();
            watchModel = watchModel.replace(/^1\.\s*/i, "").trim();
          }

          if (
            monthlyPrices.length === 0 &&
            (lowerLine.includes("monthly") || lowerLine.includes("price"))
          ) {
            const allNumbers = line.match(/\d{3,6}/g);
            if (allNumbers && allNumbers.length >= 12) {
              monthlyPrices = allNumbers.slice(0, 12).map((n) => parseInt(n));
            }
          }
        }

        // Generate default monthly prices if still empty
        if (monthlyPrices.length === 0) {
          const basePrice = 5000; // Default base price
          monthlyPrices = Array.from({ length: 12 }, (_, i) => {
            const variation = Math.random() * 1000 - 500; // ±500 variation
            return Math.max(1000, Math.round(basePrice + variation));
          });
        }
      }

      const currentMarketPrice = monthlyPrices[11] || 0; // Last month is current price

      console.log("Parsed Analysis Results:");
      console.log(`  - Watch Model: ${watchModel}`);
      console.log(`  - Monthly Prices: ${monthlyPrices.join(", ")}`);
      console.log(`  - Current Market Price: ${currentMarketPrice}`);
      console.log(`  - Month Range: ${startMonth} to ${endMonth}`);

      // Validation
      if (!watchModel) {
        watchModel = "Luxury Watch - Model Unknown";
      }

      if (currentMarketPrice < 100) {
        console.log("Invalid current price, using default");
        monthlyPrices[11] = 5000;
      }

      // Now perform trend analysis
      const trendAnalysis = await performTrendAnalysis(
        watchModel,
        monthlyPrices,
        startMonth,
        endMonth
      );

      return {
        watchModel: watchModel,
        marketPrice: currentMarketPrice,
        monthlyPrices: monthlyPrices,
        trendAnalysis: trendAnalysis.analysis,
        recommendations: trendAnalysis.recommendations,
        confidence: 0.85,
        analysisText: analysisText,
        monthRange: { startMonth, endMonth, months },
      };
    } else {
      throw new Error("Invalid response from Gemini API");
    }
  } catch (error) {
    console.error("Error in AI analysis:", error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

// Perform trend analysis on monthly price data
const performTrendAnalysis = async (
  watchModel,
  monthlyPrices,
  startMonth,
  endMonth
) => {
  try {
    console.log("Starting trend analysis...");

    // Generate dynamic month names for the current 12-month period
    const { months } = generateMonthRange();

    // Create price data string for AI
    const priceDataString = monthlyPrices
      .map((price, index) => `${months[index]}: $${price}`)
      .join(", ");

    const trendRequestBody = {
      contents: [
        {
          parts: [
            {
              text: `Given this monthly ${watchModel} price data from ${startMonth} to ${endMonth}: ${priceDataString}, 
              
TREND_ANALYSIS: [Summarize the overall trend (upward/downward/stable), identify the highest and lowest points, and note any significant price movements. Keep it concise in 2-3 sentences.]

RECOMMENDATIONS: [Provide ONE clear recommendation about whether this is a good time to buy, sell, or hold, and predict the price trend for the next 3 months. Keep it concise in 2-3 sentences.]

Important:
- Use exactly the format "TREND_ANALYSIS:" and "RECOMMENDATIONS:" (with colons)
- Give only ONE clear and concise analysis for each
- Focus on actionable insights
- Keep each section to 2-3 sentences maximum`,
            },
          ],
        },
      ],
    };

    const trendResponse = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      trendRequestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (
      trendResponse.data &&
      trendResponse.data.candidates &&
      trendResponse.data.candidates[0]
    ) {
      const trendText = trendResponse.data.candidates[0].content.parts[0].text;
      console.log("Raw Trend Analysis Response:", trendText);

      // Parse trend analysis
      let analysis = null;
      let recommendations = null;

      const analysisMatch = trendText.match(
        /TREND_ANALYSIS:\s*(.+?)(?=RECOMMENDATIONS:|$)/is
      );
      if (analysisMatch) {
        analysis = analysisMatch[1].trim();
      }

      const recommendationsMatch = trendText.match(
        /RECOMMENDATIONS:\s*(.+?)$/is
      );
      if (recommendationsMatch) {
        recommendations = recommendationsMatch[1].trim();
      }

      // Fallback parsing
      if (!analysis || !recommendations) {
        const lines = trendText.split("\n").filter((line) => line.trim());
        if (lines.length >= 2) {
          analysis = analysis || lines[0];
          recommendations = recommendations || lines[lines.length - 1];
        }
      }

      // Default values if parsing fails
      if (!analysis) {
        const trend =
          monthlyPrices[11] > monthlyPrices[0]
            ? "upward"
            : monthlyPrices[11] < monthlyPrices[0]
            ? "downward"
            : "stable";
        analysis = `The price shows a ${trend} trend over the 12-month period from ${startMonth} to ${endMonth}. Current market conditions appear ${
          trend === "upward"
            ? "strong"
            : trend === "downward"
            ? "weak"
            : "stable"
        }.`;
      }

      if (!recommendations) {
        const isGoodTime = monthlyPrices[11] < Math.max(...monthlyPrices) * 0.9;
        recommendations = isGoodTime
          ? "Current pricing presents a good buying opportunity. Market conditions suggest potential for appreciation in the next 3 months."
          : "Current pricing is at premium levels. Consider waiting for a market correction or holding current positions.";
      }

      console.log("Parsed Trend Analysis:");
      console.log(`  - Analysis: ${analysis}`);
      console.log(`  - Recommendations: ${recommendations}`);

      return {
        analysis: analysis,
        recommendations: recommendations,
      };
    } else {
      throw new Error("Invalid trend analysis response");
    }
  } catch (error) {
    console.error("Error in trend analysis:", error);

    // Generate basic trend analysis as fallback
    const trend =
      monthlyPrices[11] > monthlyPrices[0]
        ? "upward"
        : monthlyPrices[11] < monthlyPrices[0]
        ? "downward"
        : "stable";
    const highestPrice = Math.max(...monthlyPrices);
    const lowestPrice = Math.min(...monthlyPrices);

    return {
      analysis: `The ${watchModel} shows a ${trend} trend over 12 months from ${startMonth} to ${endMonth}, ranging from $${lowestPrice.toLocaleString()} to $${highestPrice.toLocaleString()}. Current price stability indicates ${
        trend === "stable"
          ? "consistent market demand"
          : trend === "upward"
          ? "growing market interest"
          : "market adjustment period"
      }.`,
      recommendations:
        monthlyPrices[11] < highestPrice * 0.9
          ? "Current pricing presents a favorable buying opportunity with potential for appreciation over the next 3 months."
          : "Current pricing is at premium levels. Consider market timing or holding existing positions for optimal returns.",
    };
  }
};

// =============================================================================
// AI ANALYSIS ENDPOINT
// =============================================================================

app.post("/analyze-watch", async (req, res) => {
  const { watchId } = req.body;

  console.log("=== AI WATCH ANALYSIS REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("==================================");

  if (!watchId) {
    return res.status(400).json({
      success: false,
      message: "Watch ID is required",
    });
  }

  try {
    // First, get the watch data
    const watchResult = await client.query(
      "SELECT watch_id, image FROM watches WHERE watch_id = $1",
      [watchId]
    );

    if (watchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchResult.rows[0];

    // Check if watch has an image
    if (!watch.image) {
      return res.status(400).json({
        success: false,
        message: "Watch must have an image for AI analysis",
      });
    }

    // Check if AI analysis already exists
    const existingAnalysis = await client.query(
      "SELECT ai_analyzed FROM aimodel WHERE watch_id = $1",
      [watchId]
    );

    console.log("Processing image:", watch.image);

    // Convert image to base64
    const base64Image = await convertImageToBase64(watch.image);

    // Analyze with AI including monthly prices and trend analysis
    const analysisResult = await analyzeWatchWithAI(base64Image);

    // Insert or update analysis results in aimodel table with monthly prices
    const result = await client.query(
      `INSERT INTO aimodel (
        watch_id, ai_analyzed, ai_watch_model, ai_market_price, ai_analysis_date, 
        ai_confidence_score, month1, month2, month3, month4, month5, month6,
        month7, month8, month9, month10, month11, month12, ai_trend_analysis, ai_recommendations
      )
       VALUES ($1, TRUE, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (watch_id) DO UPDATE SET
         ai_analyzed = TRUE,
         ai_watch_model = $2,
         ai_market_price = $3,
         ai_analysis_date = CURRENT_TIMESTAMP,
         ai_confidence_score = $4,
         month1 = $5, month2 = $6, month3 = $7, month4 = $8, month5 = $9, month6 = $10,
         month7 = $11, month8 = $12, month9 = $13, month10 = $14, month11 = $15, month12 = $16,
         ai_trend_analysis = $17,
         ai_recommendations = $18,
         updated_at = CURRENT_TIMESTAMP`,
      [
        watchId,
        analysisResult.watchModel,
        analysisResult.marketPrice,
        analysisResult.confidence,
        ...analysisResult.monthlyPrices, // Spread the 12 monthly prices
        analysisResult.trendAnalysis,
        analysisResult.recommendations,
      ]
    );

    console.log("AI analysis completed and saved with monthly price tracking");

    res.json({
      success: true,
      message: "AI analysis completed successfully",
      data: {
        watchId: watchId,
        aiWatchModel: analysisResult.watchModel,
        aiMarketPrice: analysisResult.marketPrice,
        monthlyPrices: analysisResult.monthlyPrices,
        trendAnalysis: analysisResult.trendAnalysis,
        recommendations: analysisResult.recommendations,
        confidence: analysisResult.confidence,
        analysisDate: new Date().toISOString(),
        analysisText: analysisResult.analysisText,
        monthRange: analysisResult.monthRange,
        isReanalysis: existingAnalysis.rows.length > 0,
      },
    });
  } catch (error) {
    console.error("Error in watch analysis:", error);
    res.status(500).json({
      success: false,
      message: "AI analysis failed",
      error: error.message,
    });
  }
});

// =============================================================================
// GET AI ANALYSIS RESULTS WITH MONTHLY PRICES
// =============================================================================

app.get("/watch-analysis/:watchId", async (req, res) => {
  const { watchId } = req.params;

  try {
    const result = await client.query(
      `SELECT 
         watch_id, ai_analyzed, ai_watch_model, ai_market_price, ai_analysis_date,
         ai_confidence_score, month1, month2, month3, month4, month5, month6,
         month7, month8, month9, month10, month11, month12, ai_trend_analysis, ai_recommendations
       FROM aimodel 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "AI analysis not found for this watch",
      });
    }

    const analysis = result.rows[0];

    // Prepare monthly prices array
    const monthlyPrices = [
      parseFloat(analysis.month1 || 0),
      parseFloat(analysis.month2 || 0),
      parseFloat(analysis.month3 || 0),
      parseFloat(analysis.month4 || 0),
      parseFloat(analysis.month5 || 0),
      parseFloat(analysis.month6 || 0),
      parseFloat(analysis.month7 || 0),
      parseFloat(analysis.month8 || 0),
      parseFloat(analysis.month9 || 0),
      parseFloat(analysis.month10 || 0),
      parseFloat(analysis.month11 || 0),
      parseFloat(analysis.month12 || 0),
    ];

    // Generate current month range for frontend
    const { months } = generateMonthRange();

    res.json({
      success: true,
      data: {
        watchId: analysis.watch_id,
        analyzed: analysis.ai_analyzed,
        watchModel: analysis.ai_watch_model,
        marketPrice: parseFloat(analysis.ai_market_price || 0),
        monthlyPrices: monthlyPrices,
        monthLabels: months,
        trendAnalysis: analysis.ai_trend_analysis,
        recommendations: analysis.ai_recommendations,
        analysisDate: analysis.ai_analysis_date,
        confidence: parseFloat(analysis.ai_confidence_score || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching analysis results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analysis results",
      error: error.message,
    });
  }
});

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

const uploadDirs = [
  "public/uploads/profile",
  "public/uploads/raw-material",
  "public/uploads/component",
  "public/uploads/watch",
  "public/uploads/certifier",
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

const storage = {
  profile: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "public/uploads/profile"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  rawMaterial: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "public/uploads/raw-material"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  component: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "public/uploads/component"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  watch: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "public/uploads/watch"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  certifier: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "public/uploads/certifier"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
};

const upload = {
  profile: multer({ storage: storage.profile }),
  rawMaterial: multer({ storage: storage.rawMaterial }),
  component: multer({ storage: storage.component }),
  watch: multer({ storage: storage.watch }),
  certifier: multer({ storage: storage.certifier }),
};

// =============================================================================
// FILE UPLOAD ENDPOINTS
// =============================================================================

app.post("/upload/profile", upload.profile.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No file uploaded",
    });
  }
  res.json({
    success: 1,
    filename: req.file.filename,
    message: "Profile image uploaded successfully",
  });
});

app.post(
  "/upload/raw-material",
  upload.rawMaterial.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    console.log("Raw material image uploaded:", req.file.filename);
    res.json({
      filename: req.file.filename,
      message: "Raw material image uploaded successfully",
    });
  }
);

app.post("/upload/component", upload.component.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  res.json({
    filename: req.file.filename,
    message: "Component image uploaded successfully",
  });
});

app.post("/upload/watch", upload.watch.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  res.json({
    filename: req.file.filename,
    message: "Watch image uploaded successfully",
  });
});

app.post("/upload/certifier", upload.certifier.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  res.json({
    filename: req.file.filename,
    message: "Certifier image uploaded successfully",
  });
});

// =============================================================================
// FILE SERVING ENDPOINTS
// =============================================================================

app.get("/file/profile/:fileName", function (req, res) {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "public/uploads/profile", fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log("Error sending profile image:", err);
      res.status(404).send("Image not found");
    }
  });
});

app.get("/file/raw-material/:fileName", function (req, res) {
  const { fileName } = req.params;
  const filePath = path.join(
    __dirname,
    "public/uploads/raw-material",
    fileName
  );
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log("Error sending raw material image:", err);
      res.status(404).send("Image not found");
    }
  });
});

app.get("/file/component/:fileName", function (req, res) {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "public/uploads/component", fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log("Error sending component image:", err);
      res.status(404).send("Image not found");
    }
  });
});

app.get("/file/watch/:fileName", function (req, res) {
  const { fileName } = req.params;
  console.log("FIXED: Serving watch image:", fileName);

  // FIXED: Enhanced validation and path handling
  if (
    !fileName ||
    fileName.trim() === "" ||
    fileName === "null" ||
    fileName === "undefined"
  ) {
    console.log("FIXED: Invalid filename:", fileName);
    return res.status(400).json({
      error: "Invalid filename",
      filename: fileName,
    });
  }

  const filePath = path.join(__dirname, "public/uploads/watch", fileName);
  console.log("FIXED: Full file path:", filePath);

  // FIXED: Check file existence before attempting to serve
  if (!fs.existsSync(filePath)) {
    console.log("FIXED: File not found:", filePath);
    return res.status(404).json({
      error: "Image not found",
      filename: fileName,
      path: filePath,
      suggestion: "Check if the file was uploaded correctly",
    });
  }

  // FIXED: Enhanced file serving with proper error handling
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("FIXED: Error sending watch image:", err);
      res.status(500).json({
        error: "Error serving image",
        filename: fileName,
        details: err.message,
      });
    } else {
      console.log("FIXED: Successfully served image:", fileName);
    }
  });
});
app.get("/file/certifier/:fileName", function (req, res) {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "public/uploads/certifier", fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log("Error sending certifier image:", err);
      res.status(404).send("Image not found");
    }
  });
});

// =============================================================================
// ID GENERATION ENDPOINTS
// =============================================================================

app.get("/generate-id/raw-material", (req, res) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const id = `RM-${timestamp}-${random}`;
  res.json({ id });
});

app.get("/generate-id/component", (req, res) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const id = `COMP-${timestamp}-${random}`;
  res.json({ id });
});

app.get("/generate-id/watch", (req, res) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const id = `WATCH-${timestamp}-${random}`;
  res.json({ id });
});

// =============================================================================
// ACCOUNT MANAGEMENT ENDPOINTS
// =============================================================================

// Add Account endpoint (simplified for admin use)
app.post("/addaccount", async (req, res) => {
  const {
    username,
    password,
    role,
    name,
    email,
    phone,
    description,
    website,
    location,
    image,
  } = req.body;

  console.log("=== ADD ACCOUNT REQUEST ===");
  console.log("Username:", username);
  console.log("Role:", role);
  console.log("Name:", name);
  console.log("===========================");

  if (!username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Username, password, and role are required",
    });
  }

  try {
    // Check if username already exists
    const checkUser = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Insert all account information in one go
    const result = await client.query(
      `INSERT INTO users (
        username, password, role, name, email, phone, 
        description, website, location, image, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id`,
      [
        username,
        password,
        role,
        name || "",
        email || "",
        phone || "",
        description || "",
        website || "",
        location || "",
        image || "",
      ]
    );

    console.log("Account created successfully");
    res.json({
      success: true,
      message: "Account created successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({
      success: false,
      message: "Error creating account",
      error: error.message,
    });
  }
});
// Enhanced Profile endpoint for better user details
app.get("/profile/:identifier", async (req, res) => {
  const { identifier } = req.params;

  console.log("=== GET PROFILE REQUEST ===");
  console.log("Identifier:", identifier);
  console.log("===========================");

  try {
    let result;

    // Try to get by ID first, then by username
    if (!isNaN(identifier)) {
      // It's a numeric ID
      result = await client.query(
        "SELECT id, username, role, name, description, website, location, image, email, phone, wallet_address, created_at, updated_at FROM users WHERE id = $1",
        [identifier]
      );
    } else {
      // It's a username
      result = await client.query(
        "SELECT id, username, role, name, description, website, location, image, email, phone, wallet_address, created_at, updated_at FROM users WHERE username = $1",
        [identifier]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    console.log("Profile found");
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

// Get All Profiles endpoint (enhanced for ManageAccount)
app.get("/profileAll", async (req, res) => {
  console.log("=== GET ALL PROFILES REQUEST ===");

  try {
    const result = await client.query(
      `SELECT 
         id,
         username,
         role,
         name,
         description,
         website,
         location,
         image,
         email,
         phone,
         wallet_address,
         created_at,
         updated_at
       FROM users 
       ORDER BY created_at DESC`
    );

    console.log(`Retrieved ${result.rows.length} profiles`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profiles",
      error: error.message,
    });
  }
});

// =============================================================================
// USER AUTHENTICATION ENDPOINTS
// =============================================================================

app.post("/register", async (req, res) => {
  const { username, password, role, fullName, email, phone, walletAddress } =
    req.body;
  console.log("Registration attempt for username:", username);

  try {
    const checkUser = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).send("Username already exists");
    }

    await client.query(
      "INSERT INTO users (username, password, role, name, email, phone, wallet_address) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [username, password, role, fullName, email, phone, walletAddress]
    );

    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, passwordLength: password?.length });

  try {
    if (!client._connected) {
      console.error("Database not connected");
      return res.status(503).json({ message: "Database connection error" });
    }

    const result = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      wallet_address: user.wallet_address,
      image: user.image,
    };

    res.json(userData);
  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});

// =============================================================================
// USER MANAGEMENT ENDPOINTS
// =============================================================================

app.get("/users", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT id, username, role, name, description, website, location, image, email, phone, wallet_address, created_at FROM users ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching users:", err.message);
    res.status(500).send("Error fetching users");
  }
});

app.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await client.query(
      "SELECT id, username, role, name, description, website, location, image, email, phone, wallet_address FROM users WHERE id = $1",
      [id]
    );
    if (data.rows.length === 0) {
      res.status(404).send("User not found");
    } else {
      res.send(data.rows[0]);
    }
  } catch (err) {
    console.log("Error fetching user:", err.message);
    res.status(500).send("Error fetching user");
  }
});

app.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    website,
    location,
    image,
    email,
    phone,
    walletAddress,
  } = req.body;

  try {
    await client.query(
      "UPDATE users SET name = $1, description = $2, website = $3, location = $4, image = $5, email = $6, phone = $7, wallet_address = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9",
      [
        name,
        description,
        website,
        location,
        image,
        email,
        phone,
        walletAddress,
        id,
      ]
    );
    res.send("User updated successfully");
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send("Error updating user");
  }
});

app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      res.status(404).send("User not found");
    } else {
      res.send("User deleted successfully");
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send("Error deleting user");
  }
});

// =============================================================================
// SUPPLIER MODULE ENDPOINTS
// =============================================================================

app.post("/raw-material", (req, res) => {
  const {
    componentId,
    materialType,
    origin,
    image,
    location,
    timestamp,
    supplierAddress,
  } = req.body;

  client.query(
    "INSERT INTO raw_materials (component_id, material_type, origin, image, location, timestamp, supplier_address) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      componentId,
      materialType,
      origin,
      image,
      location,
      timestamp,
      supplierAddress,
    ],
    (err, result) => {
      if (err) {
        console.log("Error adding raw material:", err.message);
        res.status(500).send("Error adding raw material");
      } else {
        console.log("Raw material added successfully");
        res.send("Raw material added");
      }
    }
  );
});

app.get("/raw-materials", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT * FROM raw_materials ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching raw materials:", err.message);
    res.status(500).send("Error fetching raw materials");
  }
});

app.get("/raw-material/:componentId", async (req, res) => {
  const { componentId } = req.params;
  console.log(`Fetching raw material: ${componentId}`);

  try {
    const data = await client.query(
      "SELECT * FROM raw_materials WHERE component_id = $1",
      [componentId]
    );

    if (data.rows.length === 0) {
      console.log(`Raw material not found: ${componentId}`);
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    console.log(`Raw material found: ${componentId}`);
    res.json(data.rows);
  } catch (err) {
    console.error(`Error fetching raw material ${componentId}:`, err);
    res.status(500).json({
      success: false,
      message: "Error fetching raw material",
      error: err.message,
    });
  }
});

app.get("/raw-materials/supplier/:supplierAddress", async (req, res) => {
  const { supplierAddress } = req.params;

  try {
    const data = await client.query(
      "SELECT * FROM raw_materials WHERE supplier_address = $1 ORDER BY created_at DESC",
      [supplierAddress]
    );
    res.json(data.rows);
  } catch (err) {
    console.error("Error fetching raw materials by supplier:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching raw materials",
      error: err.message,
    });
  }
});

// =============================================================================
// MANUFACTURER MODULE ENDPOINTS
// =============================================================================

app.post("/component", async (req, res) => {
  const {
    componentId,
    componentType,
    serialNumber,
    rawMaterialId,
    image,
    location,
    timestamp,
    manufacturerAddress,
  } = req.body;

  try {
    const checkExisting = await client.query(
      "SELECT component_id FROM components WHERE component_id = $1",
      [componentId]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).send("Component ID already exists");
    }

    const checkRawMaterial = await client.query(
      "SELECT component_id, used FROM raw_materials WHERE component_id = $1",
      [rawMaterialId]
    );

    if (checkRawMaterial.rows.length === 0) {
      return res.status(400).send("Raw material not found");
    }

    if (checkRawMaterial.rows[0].used) {
      return res.status(400).send("Raw material has already been used");
    }

    await client.query(
      "INSERT INTO components (component_id, component_type, serial_number, raw_material_id, image, location, timestamp, manufacturer_address, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '0')",
      [
        componentId,
        componentType,
        serialNumber,
        rawMaterialId,
        image,
        location,
        timestamp,
        manufacturerAddress,
      ]
    );

    await client.query(
      "UPDATE raw_materials SET used = TRUE WHERE component_id = $1",
      [rawMaterialId]
    );

    console.log("Component added successfully");
    res.send("Component added");
  } catch (err) {
    console.error("Error adding component:", err);
    if (err.code === "23505") {
      res.status(400).send("Component ID already exists");
    } else {
      res.status(500).send(`Error adding component: ${err.message}`);
    }
  }
});

app.get("/components", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT * FROM components ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching components:", err.message);
    res.status(500).send("Error fetching components");
  }
});

app.get("/component/:componentId", async (req, res) => {
  const { componentId } = req.params;
  console.log(`Fetching component: ${componentId}`);

  try {
    const data = await client.query(
      `SELECT c.*, rm.material_type, rm.origin 
       FROM components c 
       LEFT JOIN raw_materials rm ON c.raw_material_id = rm.component_id 
       WHERE c.component_id = $1`,
      [componentId]
    );

    if (data.rows.length === 0) {
      console.log(`Component not found: ${componentId}`);
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    console.log(`Component found: ${componentId}`);
    res.json(data.rows);
  } catch (err) {
    console.error(`Error fetching component ${componentId}:`, err);
    res.status(500).json({
      success: false,
      message: "Error fetching component",
      error: err.message,
    });
  }
});

app.get("/components/manufacturer/:manufacturerAddress", async (req, res) => {
  const { manufacturerAddress } = req.params;

  try {
    const data = await client.query(
      "SELECT * FROM components WHERE manufacturer_address = $1 ORDER BY created_at DESC",
      [manufacturerAddress]
    );
    res.json(data.rows);
  } catch (err) {
    console.error("Error fetching components by manufacturer:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching components",
      error: err.message,
    });
  }
});

// =============================================================================
// CERTIFIER MODULE ENDPOINTS
// =============================================================================

app.post("/certify-component", (req, res) => {
  const {
    componentId,
    remarks,
    certifierImage,
    location,
    timestamp,
    certifierAddress,
  } = req.body;

  client.query(
    "UPDATE components SET status = '1', certifier_remarks = $1, certifier_image = $2, certify_timestamp = $3, certifier_address = $4, certifier_location = $5 WHERE component_id = $6 AND status = '0'",
    [
      remarks,
      certifierImage,
      timestamp,
      certifierAddress,
      location,
      componentId,
    ],
    (err, result) => {
      if (err) {
        console.log("Error certifying component:", err.message);
        res.status(500).send("Error certifying component");
      } else if (result.rowCount === 0) {
        res
          .status(400)
          .send(
            "Component not found or not in correct status for certification"
          );
      } else {
        console.log("Component certified successfully");
        res.send("Component certified");
      }
    }
  );
});

app.get("/components/uncertified", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT * FROM components WHERE status = '0' ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching uncertified components:", err.message);
    res.status(500).send("Error fetching uncertified components");
  }
});

app.get("/components/certified", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT * FROM components WHERE status = '1' ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching certified components:", err.message);
    res.status(500).send("Error fetching certified components");
  }
});

// =============================================================================
// ASSEMBLER MODULE ENDPOINTS
// =============================================================================

app.post("/watch", async (req, res) => {
  const {
    watchId,
    componentIds,
    image,
    location,
    timestamp,
    assemblerAddress,
    generateNFT = true, // New parameter to control NFT generation
  } = req.body;

  console.log(
    "=== FIXED: ENHANCED WATCH CREATION WITH PROPER IMAGE HANDLING ==="
  );
  console.log("Watch ID:", watchId);
  console.log("Assembler Address:", assemblerAddress);
  console.log("Component IDs:", componentIds);
  console.log("Original Image:", image);
  console.log("Generate NFT:", generateNFT);
  console.log("==============================================================");

  try {
    // CRITICAL FIX: Verify image file exists before proceeding
    if (image && image.trim() !== "") {
      const imagePath = path.join(__dirname, "public/uploads/watch", image);
      if (!fs.existsSync(imagePath)) {
        console.error("FIXED: Image file not found:", imagePath);
        return res.status(400).json({
          success: false,
          message: `Image file not found: ${image}`,
          watchId: watchId,
        });
      }
      console.log("FIXED: Image file verified:", imagePath);
    }

    let nftMetadata = null;

    // Generate NFT metadata if requested and image exists
    if (generateNFT && image && image.trim() !== "") {
      try {
        console.log("FIXED: Generating NFT metadata with verified image...");
        nftMetadata = await generateWatchNFTMetadata({
          watchId,
          componentIds,
          image,
          location,
          timestamp,
          assemblerAddress,
        });
        console.log("FIXED: NFT metadata generated successfully:", {
          metadataURI: nftMetadata.metadataURI,
          imageURI: nftMetadata.imageURI,
          isLocalFallback: nftMetadata.isLocalFallback,
        });
      } catch (nftError) {
        console.error("FIXED: NFT generation failed:", nftError);
        // Don't fail the whole process, just continue without NFT
        nftMetadata = null;
      }
    } else if (generateNFT && (!image || image.trim() === "")) {
      console.warn(
        "FIXED: NFT generation requested but no valid image provided"
      );
    }

    // CRITICAL FIX: Insert watch data with explicit image handling
    const insertResult = await client.query(
      `INSERT INTO watches (
        watch_id, 
        component_ids, 
        image, 
        location, 
        timestamp, 
        assembler_address, 
        current_owner, 
        ownership_history, 
        shipping_status, 
        retail_price, 
        available_for_sale, 
        sold,
        last_transfer_timestamp,
        nft_metadata_uri,
        nft_image_uri,
        nft_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        watchId,
        componentIds,
        image || null, // FIXED: Explicit null handling
        location,
        timestamp,
        assemblerAddress,
        assemblerAddress,
        [assemblerAddress],
        0,
        0.0,
        false,
        false,
        null,
        nftMetadata?.metadataURI || null,
        nftMetadata?.imageURI || null,
        !!nftMetadata,
      ]
    );

    // CRITICAL FIX: Verify the insertion
    const insertedWatch = insertResult.rows[0];
    console.log("FIXED: Watch inserted with image:", {
      watchId: insertedWatch.watch_id,
      image: insertedWatch.image,
      nftMetadataUri: insertedWatch.nft_metadata_uri,
      nftImageUri: insertedWatch.nft_image_uri,
      nftGenerated: insertedWatch.nft_generated,
    });

    // Create empty AI model entry for this watch
    await client.query(
      `INSERT INTO aimodel (watch_id, ai_analyzed) VALUES ($1, FALSE)`,
      [watchId]
    );

    // Mark all components as used in assembly (status = 2)
    for (const componentId of componentIds) {
      try {
        await client.query(
          "UPDATE components SET status = '2' WHERE component_id = $1 AND status = '1'",
          [componentId]
        );
      } catch (updateErr) {
        console.log("Error updating component status:", updateErr.message);
      }
    }

    console.log("FIXED: Watch created successfully with proper image handling");

    res.json({
      success: true,
      message: "Watch created successfully",
      watchId: watchId,
      image: image,
      imageVerified: !!image && image.trim() !== "",
      nftData: nftMetadata,
      nftGenerated: !!nftMetadata,
      insertedData: {
        image: insertedWatch.image,
        nftImageUri: insertedWatch.nft_image_uri,
        nftGenerated: insertedWatch.nft_generated,
      },
    });
  } catch (err) {
    console.error("FIXED: Error creating watch:", err);
    res.status(500).json({
      success: false,
      message: "Error creating watch",
      error: err.message,
      watchId: watchId,
    });
  }
});

app.get("/watches", async (req, res) => {
  try {
    const data = await client.query(
      "SELECT * FROM watches ORDER BY created_at DESC"
    );
    res.send(data.rows);
  } catch (err) {
    console.log("Error fetching watches:", err.message);
    res.status(500).send("Error fetching watches");
  }
});

// Enhanced Watch endpoint with AI analysis data from aimodel table
app.get("/watch/:watchId", async (req, res) => {
  const { watchId } = req.params;
  console.log("FIXED: Fetching watch with enhanced image debugging:", watchId);

  try {
    const data = await client.query(
      `SELECT w.*, 
       COALESCE(w.shipping_trail, ARRAY[]::text[]) as shipping_trail,
       COALESCE(w.ownership_history, ARRAY[]::text[]) as ownership_history,
       COALESCE(w.shipping_status, 0) as shipping_status,
       CASE WHEN w.available_for_sale IS TRUE THEN true ELSE false END as available_for_sale,
       CASE WHEN w.sold IS TRUE THEN true ELSE false END as sold,
       COALESCE(w.retail_price, 0.00) as retail_price,
       w.retailer_timestamp,
       w.consumer_timestamp,
       w.last_transfer_timestamp,
       w.retailer_location,
       CASE WHEN ai.ai_analyzed IS TRUE THEN true ELSE false END as ai_analyzed,
       ai.ai_watch_model,
       COALESCE(ai.ai_market_price, 0.00) as ai_market_price,
       ai.ai_analysis_date,
       COALESCE(ai.ai_confidence_score, 0.00) as ai_confidence_score,
       ai.month1, ai.month2, ai.month3, ai.month4, ai.month5, ai.month6,
       ai.month7, ai.month8, ai.month9, ai.month10, ai.month11, ai.month12,
       ai.ai_trend_analysis, ai.ai_recommendations
       FROM watches w 
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.watch_id = $1`,
      [watchId]
    );

    if (data.rows.length === 0) {
      console.log("FIXED: Watch not found:", watchId);
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = data.rows[0];

    // CRITICAL FIX: Enhanced image debugging and validation
    console.log("FIXED: Watch found with enhanced image analysis:");
    console.log(`  Watch ID: ${watch.watch_id}`);
    console.log(
      `  Image field: "${watch.image}" (type: ${typeof watch.image})`
    );
    console.log(`  Image is null: ${watch.image === null}`);
    console.log(`  Image is empty: ${watch.image === ""}`);
    console.log(`  Image trimmed: "${watch.image?.trim()}"`);
    console.log(`  NFT Metadata URI: ${watch.nft_metadata_uri}`);
    console.log(`  NFT Image URI: ${watch.nft_image_uri}`);
    console.log(`  NFT Generated: ${watch.nft_generated}`);

    // FIXED: Check if image file actually exists
    let imageFileExists = false;
    let imageFilePath = null;
    if (watch.image && watch.image.trim() !== "") {
      imageFilePath = path.join(__dirname, "public/uploads/watch", watch.image);
      imageFileExists = fs.existsSync(imageFilePath);
      console.log(
        `  Image file exists: ${imageFileExists} at ${imageFilePath}`
      );
    }

    // FIXED: Enhance response with debugging information
    const enhancedResponse = data.rows.map((row) => ({
      ...row,
      // Add debugging fields for frontend
      _debug_image_info: {
        image_field: row.image,
        image_type: typeof row.image,
        image_is_null: row.image === null,
        image_is_empty: row.image === "",
        image_trimmed: row.image?.trim(),
        image_file_exists: imageFileExists,
        image_file_path: imageFilePath,
        nft_image_uri: row.nft_image_uri,
        nft_generated: row.nft_generated,
        has_nft_fallback: !!(
          row.nft_image_uri && row.nft_image_uri.trim() !== ""
        ),
        recommended_image_source: getRecommendedImageSource(row),
      },
    }));

    console.log("FIXED: Sending enhanced response with image debugging");
    res.json(enhancedResponse);
  } catch (err) {
    console.error("FIXED: Error fetching watch:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching watch",
      error: err.message,
    });
  }
});

// FIXED: Helper function to determine recommended image source
const getRecommendedImageSource = (watchRow) => {
  // Priority 1: Local image if file exists
  if (watchRow.image && watchRow.image.trim() !== "") {
    const imagePath = path.join(
      __dirname,
      "public/uploads/watch",
      watchRow.image
    );
    if (fs.existsSync(imagePath)) {
      return {
        type: "local",
        url: `http://localhost:5000/file/watch/${watchRow.image}`,
        priority: 1,
      };
    }
  }

  // Priority 2: NFT IPFS image
  if (watchRow.nft_image_uri && watchRow.nft_image_uri.trim() !== "") {
    if (watchRow.nft_image_uri.startsWith("ipfs://")) {
      return {
        type: "ipfs",
        url: `https://gateway.pinata.cloud/ipfs/${watchRow.nft_image_uri.slice(
          7
        )}`,
        priority: 2,
      };
    } else if (watchRow.nft_image_uri.startsWith("http")) {
      return {
        type: "http",
        url: watchRow.nft_image_uri,
        priority: 2,
      };
    }
  }

  // No valid source
  return {
    type: "none",
    url: null,
    priority: 0,
  };
};

app.get("/watches/assembler/:assemblerAddress", async (req, res) => {
  const { assemblerAddress } = req.params;

  try {
    const data = await client.query(
      "SELECT * FROM watches WHERE assembler_address = $1 ORDER BY created_at DESC",
      [assemblerAddress]
    );
    res.json(data.rows);
  } catch (err) {
    console.error("Error fetching watches by assembler:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching watches",
      error: err.message,
    });
  }
});

app.get("/watches/available", async (req, res) => {
  try {
    const data = await client.query(
      `SELECT w.*,
       CASE WHEN ai.ai_analyzed IS TRUE THEN true ELSE false END as ai_analyzed,
       ai.ai_watch_model,
       COALESCE(ai.ai_market_price, 0.00) as ai_market_price,
       COALESCE(ai.ai_confidence_score, 0.00) as ai_confidence_score
       FROM watches w 
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.shipping_status = 3 
       AND w.available_for_sale = TRUE
       AND w.sold = FALSE
       ORDER BY w.created_at DESC`
    );
    res.json(data.rows);
  } catch (err) {
    console.error("Error fetching available watches:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching available watches",
      error: err.message,
    });
  }
});

app.get("/watches/for-sale", async (req, res) => {
  try {
    const data = await client.query(
      `SELECT w.*,
       CASE WHEN ai.ai_analyzed IS TRUE THEN true ELSE false END as ai_analyzed,
       ai.ai_watch_model,
       COALESCE(ai.ai_market_price, 0.00) as ai_market_price,
       COALESCE(ai.ai_confidence_score, 0.00) as ai_confidence_score
       FROM watches w 
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.available_for_sale = TRUE 
       AND w.sold = FALSE
       AND w.retail_price > 0
       ORDER BY w.created_at DESC`
    );
    res.json(data.rows);
  } catch (err) {
    console.error("Error fetching watches for sale:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching watches for sale",
      error: err.message,
    });
  }
});
// =============================================================================
// NFT METADATA ENDPOINTS
// =============================================================================

/**
 * Generate NFT metadata for existing watch
 */
app.post("/generate-nft-metadata", async (req, res) => {
  const { watchId } = req.body;

  console.log("=== GENERATE NFT METADATA REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("====================================");

  if (!watchId) {
    return res.status(400).json({
      success: false,
      message: "Watch ID is required",
    });
  }

  try {
    // Get watch data
    const watchResult = await client.query(
      "SELECT * FROM watches WHERE watch_id = $1",
      [watchId]
    );

    if (watchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchResult.rows[0];

    if (!watch.image) {
      return res.status(400).json({
        success: false,
        message: "Watch must have an image to generate NFT metadata",
      });
    }

    // Generate NFT metadata
    const nftData = await generateWatchNFTMetadata({
      watchId: watch.watch_id,
      componentIds: watch.component_ids,
      image: watch.image,
      location: watch.location,
      timestamp: watch.timestamp,
      assemblerAddress: watch.assembler_address,
    });

    // Update watch with NFT data
    await client.query(
      `UPDATE watches 
       SET nft_metadata_uri = $1, 
           nft_image_uri = $2, 
           nft_generated = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE watch_id = $3`,
      [nftData.metadataURI, nftData.imageURI, watchId]
    );

    console.log("FIXED: NFT metadata generated and stored");

    res.json({
      success: true,
      message: "NFT metadata generated successfully",
      watchId: watchId,
      nftData: nftData,
    });
  } catch (error) {
    console.error("FIXED: Error generating NFT metadata:", error);
    res.status(500).json({
      success: false,
      message: "Error generating NFT metadata",
      error: error.message,
    });
  }
});

app.post("/update-nft-metadata", async (req, res) => {
  const { watchId, updateReason, additionalData } = req.body;

  console.log("=== UPDATE NFT METADATA REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("Update Reason:", updateReason);
  console.log("==================================");

  try {
    // Get current watch data
    const watchResult = await client.query(
      `SELECT w.*, 
       COALESCE(w.shipping_trail, ARRAY[]::text[]) as shipping_trail,
       COALESCE(w.ownership_history, ARRAY[]::text[]) as ownership_history
       FROM watches w 
       WHERE w.watch_id = $1`,
      [watchId]
    );

    if (watchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchResult.rows[0];

    if (!watch.nft_generated) {
      return res.status(400).json({
        success: false,
        message: "NFT metadata not generated for this watch",
      });
    }

    // Generate updated metadata with supply chain progression
    const updatedNftData = await generateWatchNFTMetadata({
      watchId: watch.watch_id,
      componentIds: watch.component_ids,
      image: watch.image,
      location: watch.location,
      timestamp: watch.timestamp,
      assemblerAddress: watch.assembler_address,
    });

    // Add supply chain progression data to metadata
    const enhancedMetadata = {
      ...updatedNftData.metadata,
      supply_chain_updates: {
        last_update: new Date().toISOString(),
        update_reason: updateReason,
        shipping_status: watch.shipping_status,
        shipping_trail: watch.shipping_trail,
        ownership_history: watch.ownership_history,
        current_owner: watch.current_owner,
        available_for_sale: watch.available_for_sale,
        sold: watch.sold,
        retail_price: watch.retail_price,
        ...additionalData,
      },
    };

    // Upload updated metadata to IPFS
    const updatedMetadataHash = await uploadMetadataToPinata(enhancedMetadata);
    const newMetadataURI = `ipfs://${updatedMetadataHash}`;

    // Update database
    await client.query(
      `UPDATE watches 
       SET nft_metadata_uri = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE watch_id = $2`,
      [newMetadataURI, watchId]
    );

    console.log("FIXED: NFT metadata updated successfully");

    res.json({
      success: true,
      message: "NFT metadata updated successfully",
      watchId: watchId,
      newMetadataURI: newMetadataURI,
      updateReason: updateReason,
    });
  } catch (error) {
    console.error("FIXED: Error updating NFT metadata:", error);
    res.status(500).json({
      success: false,
      message: "Error updating NFT metadata",
      error: error.message,
    });
  }
});

/**
 * Get NFT metadata for a watch
 */
app.get("/nft-metadata/:watchId", async (req, res) => {
  const { watchId } = req.params;

  try {
    const result = await client.query(
      `SELECT 
         watch_id,
         nft_metadata_uri,
         nft_image_uri,
         nft_generated,
         assembler_address,
         created_at
       FROM watches 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = result.rows[0];

    if (!watch.nft_generated || !watch.nft_metadata_uri) {
      return res.status(404).json({
        success: false,
        message: "NFT metadata not generated for this watch",
      });
    }

    res.json({
      success: true,
      data: {
        watchId: watch.watch_id,
        metadataURI: watch.nft_metadata_uri,
        imageURI: watch.nft_image_uri,
        assembler: watch.assembler_address,
        createdAt: watch.created_at,
        nftGenerated: watch.nft_generated,
      },
    });
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching NFT metadata",
      error: error.message,
    });
  }
});
/**
 * Update NFT metadata (for supply chain progression)
 */
app.post("/update-nft-metadata", async (req, res) => {
  const { watchId, updateReason, additionalData } = req.body;

  console.log("=== UPDATE NFT METADATA REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("Update Reason:", updateReason);
  console.log("==================================");

  try {
    // Get current watch data
    const watchResult = await client.query(
      `SELECT w.*, 
       COALESCE(w.shipping_trail, ARRAY[]::text[]) as shipping_trail,
       COALESCE(w.ownership_history, ARRAY[]::text[]) as ownership_history
       FROM watches w 
       WHERE w.watch_id = $1`,
      [watchId]
    );

    if (watchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchResult.rows[0];

    if (!watch.nft_generated) {
      return res.status(400).json({
        success: false,
        message: "NFT metadata not generated for this watch",
      });
    }

    // Generate updated metadata with supply chain progression
    const updatedNftData = await generateWatchNFTMetadata({
      watchId: watch.watch_id,
      componentIds: watch.component_ids,
      image: watch.image,
      location: watch.location,
      timestamp: watch.timestamp,
      assemblerAddress: watch.assembler_address,
    });

    // Add supply chain progression data to metadata
    const enhancedMetadata = {
      ...updatedNftData.metadata,
      supply_chain_updates: {
        last_update: new Date().toISOString(),
        update_reason: updateReason,
        shipping_status: watch.shipping_status,
        shipping_trail: watch.shipping_trail,
        ownership_history: watch.ownership_history,
        current_owner: watch.current_owner,
        available_for_sale: watch.available_for_sale,
        sold: watch.sold,
        retail_price: watch.retail_price,
        ...additionalData,
      },
    };

    // Upload updated metadata to IPFS
    const updatedMetadataHash = await uploadMetadataToPinata(enhancedMetadata);
    const newMetadataURI = `ipfs://${updatedMetadataHash}`;

    // Update database
    await client.query(
      `UPDATE watches 
       SET nft_metadata_uri = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE watch_id = $2`,
      [newMetadataURI, watchId]
    );

    console.log("✅ NFT metadata updated successfully");

    res.json({
      success: true,
      message: "NFT metadata updated successfully",
      watchId: watchId,
      newMetadataURI: newMetadataURI,
      updateReason: updateReason,
    });
  } catch (error) {
    console.error("❌ Error updating NFT metadata:", error);
    res.status(500).json({
      success: false,
      message: "Error updating NFT metadata",
      error: error.message,
    });
  }
});

// =============================================================================
// DISTRIBUTOR MODULE ENDPOINTS
// =============================================================================

app.post("/update-shipping", async (req, res) => {
  const { watchId, shippingStatus, location, distributorAddress } = req.body;

  console.log("=== UPDATE SHIPPING REQUEST ===");
  console.log("Request body:", req.body);
  console.log("Watch ID:", watchId);
  console.log(
    "Shipping Status:",
    shippingStatus,
    "| Type:",
    typeof shippingStatus
  );
  console.log("Location:", location);
  console.log("Distributor Address:", distributorAddress);
  console.log("===============================");

  if (!watchId) {
    console.log("Missing watchId");
    return res.status(400).send("Watch ID is required");
  }

  if (!shippingStatus && shippingStatus !== 0) {
    console.log("Missing shippingStatus");
    return res.status(400).send("Shipping status is required");
  }

  if (!location) {
    console.log("Missing location");
    return res.status(400).send("Location is required");
  }

  if (!distributorAddress) {
    console.log("Missing distributorAddress");
    return res.status(400).send("Distributor address is required");
  }

  const statusNum = parseInt(shippingStatus);
  if (isNaN(statusNum) || statusNum < 1 || statusNum > 3) {
    console.log("Invalid shipping status:", shippingStatus);
    return res.status(400).send("Shipping status must be between 1 and 3");
  }

  try {
    const checkResult = await client.query(
      "SELECT watch_id, shipping_status, shipping_trail, current_owner, ownership_history FROM watches WHERE watch_id = $1",
      [watchId]
    );

    if (checkResult.rows.length === 0) {
      console.log("Watch not found:", watchId);
      return res.status(404).send("Watch not found");
    }

    const currentWatch = checkResult.rows[0];
    const currentStatus = parseInt(currentWatch.shipping_status) || 0;

    console.log("Current watch status:", currentStatus);
    console.log("New status:", statusNum);
    console.log("Current Owner:", currentWatch.current_owner);
    console.log("Ownership History:", currentWatch.ownership_history);

    if (statusNum !== currentStatus + 1) {
      console.log("Invalid status progression");
      return res
        .status(400)
        .send(
          `Invalid status progression. Current status: ${currentStatus}, Expected next: ${
            currentStatus + 1
          }, Received: ${statusNum}`
        );
    }

    if (currentStatus >= 3) {
      console.log("Watch already delivered");
      return res.status(400).send("Watch has already been delivered");
    }

    // FIXED: Enhanced shipping timestamp with consistent ISO format
    const isoTimestamp = new Date().toISOString();
    const statusLabels = {
      1: "SHIPPED",
      2: "IN TRANSIT",
      3: "DELIVERED",
    };

    // FIXED: Enhanced format with both locale and ISO timestamps for better parsing
    const localeString = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // CRITICAL: Use enhanced format that includes ISO timestamp for extraction
    const trailEntry = `${statusLabels[statusNum]} at ${location} on ${localeString} (ISO: ${isoTimestamp})`;
    console.log("FIXED: Adding enhanced trail entry:", trailEntry);
    let updateQuery;
    let updateParams;

    // Check if distributor is already in ownership history to avoid duplicates
    const ownershipHistory = currentWatch.ownership_history || [];
    const isDistributorInHistory =
      ownershipHistory.includes(distributorAddress);

    if (!isDistributorInHistory) {
      // Add distributor to ownership tracking when they start handling the watch
      console.log("Adding distributor to ownership history");
      updateQuery = `UPDATE watches 
                     SET shipping_status = $1, 
                         shipping_trail = array_append(COALESCE(shipping_trail, ARRAY[]::text[]), $2), 
                         distributor_address = $3,
                         current_owner = $4,
                         ownership_history = array_append(COALESCE(ownership_history, ARRAY[]::text[]), $4),
                         updated_at = CURRENT_TIMESTAMP
                     WHERE watch_id = $5`;
      updateParams = [
        statusNum,
        trailEntry,
        distributorAddress,
        distributorAddress,
        watchId,
      ];
    } else {
      // Distributor already in history, just update shipping
      updateQuery = `UPDATE watches 
                     SET shipping_status = $1, 
                         shipping_trail = array_append(COALESCE(shipping_trail, ARRAY[]::text[]), $2), 
                         distributor_address = $3,
                         current_owner = $4,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE watch_id = $5`;
      updateParams = [
        statusNum,
        trailEntry,
        distributorAddress,
        distributorAddress,
        watchId,
      ];
    }

    const updateResult = await client.query(updateQuery, updateParams);

    if (updateResult.rowCount === 0) {
      console.log("Failed to update watch");
      return res.status(500).send("Failed to update watch");
    }

    console.log("Shipping updated successfully");
    console.log("Rows affected:", updateResult.rowCount);
    console.log("Updated current_owner to:", distributorAddress);

    // Verify the update
    const verifyResult = await client.query(
      "SELECT shipping_status, shipping_trail, current_owner, ownership_history FROM watches WHERE watch_id = $1",
      [watchId]
    );

    if (verifyResult.rows.length > 0) {
      const updatedWatch = verifyResult.rows[0];
      console.log(
        "Verification - Updated status:",
        updatedWatch.shipping_status
      );
      console.log(
        "Verification - Trail length:",
        updatedWatch.shipping_trail?.length || 0
      );
      console.log("Verification - Current Owner:", updatedWatch.current_owner);
      console.log(
        "Verification - Ownership History:",
        updatedWatch.ownership_history
      );
    }

    res.json({
      success: true,
      message: "Shipping status updated successfully",
      watchId: watchId,
      newStatus: statusNum,
      statusLabel: statusLabels[statusNum],
      location: location,
      currentOwner: distributorAddress,
      timestamp: isoTimestamp,
      localeTimestamp: localeString,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating shipping status",
      error: err.message,
    });
  }
});

app.get("/watches/shipping", async (req, res) => {
  try {
    const data = await client.query(
      `SELECT watch_id, shipping_status, shipping_trail, distributor_address, created_at, updated_at, retail_price 
       FROM watches 
       ORDER BY updated_at DESC`
    );

    console.log("Fetched watches for shipping:", data.rows.length);

    res.json({
      success: true,
      watches: data.rows,
      count: data.rows.length,
    });
  } catch (err) {
    console.error("Error fetching watches for shipping:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching watches",
      error: err.message,
    });
  }
});

app.get("/shipping/stats", async (req, res) => {
  try {
    const stats = await client.query(`
      SELECT 
        shipping_status,
        COUNT(*) as count
      FROM watches 
      WHERE shipping_status IS NOT NULL
      GROUP BY shipping_status
      ORDER BY shipping_status
    `);

    const statusCounts = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
    };

    stats.rows.forEach((row) => {
      statusCounts[row.shipping_status] = parseInt(row.count);
    });

    console.log("Shipping statistics:", statusCounts);

    res.json({
      success: true,
      statistics: statusCounts,
      labels: {
        0: "Not Shipped",
        1: "Shipped",
        2: "In Transit",
        3: "Delivered",
      },
    });
  } catch (err) {
    console.error("Error fetching shipping stats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching shipping statistics",
      error: err.message,
    });
  }
});

// =============================================================================
// ENHANCED RETAILER MODULE - MARK AVAILABLE FOR SALE WITH TIMESTAMP COLUMNS
// =============================================================================

app.post("/mark-available", async (req, res) => {
  const { watchId, retailerAddress, retailPrice, location, timestamp } =
    req.body;

  console.log("=== MARK AVAILABLE REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("Retailer Address:", retailerAddress);
  console.log("Retail Price:", retailPrice, "Type:", typeof retailPrice);
  console.log("Retailer Location:", location);
  console.log("Retailer Timestamp:", timestamp);
  console.log("==============================");

  // Input validation
  if (!watchId) {
    return res.status(400).json({
      success: false,
      message: "Watch ID is required",
    });
  }

  if (!retailerAddress) {
    return res.status(400).json({
      success: false,
      message: "Retailer address is required",
    });
  }

  // FIXED: Use string-based decimal precision to avoid floating-point errors
  const formatPrecisePrice = (price) => {
    const priceStr = price.toString();
    const decimalIndex = priceStr.indexOf(".");
    if (decimalIndex === -1) {
      return `${priceStr}.00`;
    } else {
      const decimals = priceStr.substring(decimalIndex + 1);
      if (decimals.length === 0) {
        return `${priceStr}00`;
      } else if (decimals.length === 1) {
        return `${priceStr}0`;
      } else {
        return `${priceStr.substring(0, decimalIndex + 3)}`;
      }
    }
  };

  const priceValue = parseFloat(retailPrice);
  if (!retailPrice || isNaN(priceValue) || priceValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid retail price greater than 0 is required",
    });
  }

  if (priceValue > 999999.99) {
    return res.status(400).json({
      success: false,
      message: "Price cannot exceed $999,999.99",
    });
  }

  const formattedPrice = formatPrecisePrice(priceValue);
  console.log("FIXED: Precise price formatting:", {
    input: retailPrice,
    parsed: priceValue,
    formatted: formattedPrice,
  });

  try {
    // Check watch exists and validate current state
    const checkWatchResult = await client.query(
      `SELECT 
         watch_id, 
         shipping_status, 
         available_for_sale, 
         sold, 
         retail_price,
         assembler_address,
         current_owner,
         ownership_history
       FROM watches 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (checkWatchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = checkWatchResult.rows[0];
    console.log("Current watch status:", watch);

    const shippingStatus = parseInt(watch.shipping_status) || 0;
    const availableForSale = watch.available_for_sale === true;
    const sold = watch.sold === true;

    // Validation: Watch must be delivered
    if (shippingStatus !== 3) {
      return res.status(400).json({
        success: false,
        message: `Watch must be delivered (status 3) before marking available for sale. Current status: ${shippingStatus}`,
      });
    }

    // Validation: Watch must not be already available for sale
    if (availableForSale) {
      return res.status(400).json({
        success: false,
        message: "This watch is already marked as available for sale",
      });
    }

    // Validation: Watch must not be sold
    if (sold) {
      return res.status(400).json({
        success: false,
        message:
          "This watch has already been sold and cannot be marked for sale again",
      });
    }

    // FIXED: Enhanced timestamp handling with proper timezone support
    let retailerTimestamp;
    if (timestamp) {
      try {
        const timestampDate = new Date(timestamp);
        if (!isNaN(timestampDate.getTime())) {
          retailerTimestamp = timestampDate.toISOString();
          console.log(
            "FIXED: Using provided retailer timestamp:",
            retailerTimestamp
          );
        } else {
          console.warn(
            "FIXED: Invalid retailer timestamp provided, using current time"
          );
          retailerTimestamp = new Date().toISOString();
        }
      } catch (error) {
        console.warn(
          "FIXED: Error parsing retailer timestamp, using current time:",
          error
        );
        retailerTimestamp = new Date().toISOString();
      }
    } else {
      retailerTimestamp = new Date().toISOString();
      console.log("FIXED: No retailer timestamp provided, using current time");
    }

    const retailerLocation = location || "Not specified";

    console.log("FIXED: Enhanced retailer timestamp handling:", {
      inputTimestamp: timestamp,
      processedTimestamp: retailerTimestamp,
      location: retailerLocation,
      timestampIsValid: !isNaN(new Date(retailerTimestamp).getTime()),
      localString: new Date(retailerTimestamp).toLocaleString(),
    });

    // Update watch to be available for sale with proper timestamp columns
    const ownershipHistory = watch.ownership_history || [];
    const isRetailerInHistory = ownershipHistory.includes(retailerAddress);

    let updateQuery;
    let updateParams;

    if (!isRetailerInHistory) {
      // Add retailer to ownership tracking with timestamp columns
      updateQuery = `UPDATE watches 
                     SET available_for_sale = TRUE, 
                         retailer_address = $1, 
                         retail_price = $2::DECIMAL(15,2),
                         retailer_location = $3,
                         retailer_timestamp = $4::TIMESTAMP WITH TIME ZONE,
                         current_owner = $1,
                         ownership_history = array_append(COALESCE(ownership_history, ARRAY[]::text[]), $1),
                         updated_at = CURRENT_TIMESTAMP
                     WHERE watch_id = $5 
                     AND shipping_status = 3 
                     AND available_for_sale = FALSE
                     AND sold = FALSE`;
      updateParams = [
        retailerAddress,
        formattedPrice,
        retailerLocation,
        retailerTimestamp,
        watchId,
      ];
    } else {
      // Retailer already in history, just update availability with timestamp columns
      updateQuery = `UPDATE watches 
                     SET available_for_sale = TRUE, 
                         retailer_address = $1, 
                         retail_price = $2::DECIMAL(15,2),
                         retailer_location = $3,
                         retailer_timestamp = $4::TIMESTAMP WITH TIME ZONE,
                         current_owner = $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE watch_id = $5 
                     AND shipping_status = 3 
                     AND available_for_sale = FALSE
                     AND sold = FALSE`;
      updateParams = [
        retailerAddress,
        formattedPrice,
        retailerLocation,
        retailerTimestamp,
        watchId,
      ];
    }

    console.log("FIXED: Update query params:", updateParams);

    const updateResult = await client.query(updateQuery, updateParams);

    if (updateResult.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Failed to mark watch as available. Watch may not meet the required conditions.",
      });
    }

    console.log(
      "FIXED: Watch marked as available successfully with correct price and timestamp"
    );

    // Verify the update with detailed logging
    const verifyResult = await client.query(
      "SELECT available_for_sale, retail_price, retailer_address, retailer_location, retailer_timestamp, current_owner, ownership_history FROM watches WHERE watch_id = $1",
      [watchId]
    );

    const verificationData = verifyResult.rows[0];
    console.log("FIXED: Detailed verification result:");
    console.log(
      `  - Available for Sale: ${verificationData.available_for_sale}`
    );
    console.log(`  - Stored Retail Price: ${verificationData.retail_price}`);
    console.log(`  - Retailer Address: ${verificationData.retailer_address}`);
    console.log(`  - Retailer Location: ${verificationData.retailer_location}`);
    console.log(
      `  - Retailer Timestamp: ${verificationData.retailer_timestamp}`
    );
    console.log(`  - Current Owner: ${verificationData.current_owner}`);
    console.log(`  - Ownership History: ${verificationData.ownership_history}`);

    res.json({
      success: true,
      message: "Watch marked as available for sale successfully",
      data: {
        watchId: watchId,
        retailerAddress: retailerAddress,
        retailPrice: parseFloat(formattedPrice),
        retailerLocation: retailerLocation,
        retailerTimestamp: retailerTimestamp,
        currentOwner: retailerAddress,
        timestamp: new Date().toISOString(),
        booleanUpdates: {
          available_for_sale: true,
          retail_price: parseFloat(formattedPrice),
          retailer_address: retailerAddress,
          retailer_location: retailerLocation,
          retailer_timestamp: retailerTimestamp,
        },
      },
      verification: verificationData,
    });
  } catch (error) {
    console.error("FIXED: Error marking watch available:", error);
    res.status(500).json({
      success: false,
      message: "Error marking watch available",
      error: error.message,
    });
  }
});
// =============================================================================
// ENHANCED CONSUMER MODULE - PURCHASE WATCH WITH CONSUMER_TIMESTAMP
// =============================================================================

app.post("/purchase-watch", async (req, res) => {
  const { watchId, buyerAddress, consumerTimestamp } = req.body;

  console.log("=== FIXED: PURCHASE WATCH REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("Buyer Address:", buyerAddress);
  console.log("Raw Consumer Timestamp:", consumerTimestamp);
  console.log("Timestamp Type:", typeof consumerTimestamp);
  console.log("=========================================");

  if (!watchId || !buyerAddress) {
    return res.status(400).json({
      success: false,
      message: "Watch ID and buyer address are required",
    });
  }

  try {
    // Check current watch status with detailed logging
    const checkResult = await client.query(
      `SELECT 
         watch_id, 
         available_for_sale, 
         sold, 
         retail_price,
         current_owner,
         retailer_address,
         ownership_history,
         shipping_status,
         consumer_timestamp,
         retailer_timestamp
       FROM watches 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = checkResult.rows[0];
    console.log("FIXED: Purchase validation data:", {
      watchId: watch.watch_id,
      availableForSale: watch.available_for_sale,
      sold: watch.sold,
      retailPrice: watch.retail_price,
      currentOwner: watch.current_owner,
      existingConsumerTimestamp: watch.consumer_timestamp,
    });

    // Validation: Check boolean conditions with explicit comparisons
    if (watch.sold === true) {
      console.log("FIXED: Validation failed - watch already sold");
      return res.status(400).json({
        success: false,
        message: "This watch has already been sold",
      });
    }

    if (watch.available_for_sale !== true) {
      console.log("FIXED: Validation failed - watch not available for sale");
      return res.status(400).json({
        success: false,
        message: "This watch is not available for sale",
      });
    }

    // Validation: Check price
    const price = parseFloat(watch.retail_price || 0);
    if (price <= 0) {
      console.log("FIXED: Validation failed - invalid price:", price);
      return res.status(400).json({
        success: false,
        message: "This watch does not have a valid retail price",
      });
    }

    // Validation: Cannot buy own watch
    if (watch.current_owner?.toLowerCase() === buyerAddress.toLowerCase()) {
      console.log("FIXED: Validation failed - buyer already owns watch");
      return res.status(400).json({
        success: false,
        message: "You already own this watch",
      });
    }

    console.log("FIXED: All validations passed - proceeding with purchase");

    // FIXED: Enhanced timestamp processing with validation
    let finalConsumerTimestamp;

    if (consumerTimestamp) {
      // Validate the provided timestamp
      const testDate = new Date(consumerTimestamp);
      if (!isNaN(testDate.getTime())) {
        finalConsumerTimestamp = consumerTimestamp;
        console.log(
          "FIXED: Using provided consumer timestamp:",
          finalConsumerTimestamp
        );
      } else {
        console.warn(
          "FIXED: Invalid consumer timestamp provided, using current time"
        );
        finalConsumerTimestamp = new Date().toISOString();
      }
    } else {
      console.log(
        "FIXED: No consumer timestamp provided, generating current time"
      );
      finalConsumerTimestamp = new Date().toISOString();
    }

    // Enhanced logging for timestamp handling
    console.log("FIXED: Final timestamp processing:", {
      provided: consumerTimestamp,
      final: finalConsumerTimestamp,
      isValid: !isNaN(new Date(finalConsumerTimestamp).getTime()),
      parsed: new Date(finalConsumerTimestamp).toLocaleString(),
    });

    // Start transaction for atomic operations
    await client.query("BEGIN");

    try {
      // Perform the purchase with enhanced timestamp handling
      const result = await client.query(
        `UPDATE watches 
         SET sold = TRUE, 
             available_for_sale = FALSE,
             current_owner = $1, 
             ownership_history = array_append(COALESCE(ownership_history, ARRAY[]::text[]), $1),
             consumer_timestamp = $3::TIMESTAMP WITH TIME ZONE,
             updated_at = CURRENT_TIMESTAMP
         WHERE watch_id = $2 
         AND sold = FALSE 
         AND available_for_sale = TRUE`,
        [buyerAddress, watchId, finalConsumerTimestamp]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        console.log("FIXED: Purchase failed - no rows updated");
        return res.status(400).json({
          success: false,
          message: "Purchase failed. Watch may no longer be available.",
        });
      }

      // Create purchase record in ownership transfers table
      await client.query(
        `INSERT INTO ownership_transfers (
          watch_id, 
          from_address, 
          to_address, 
          transfer_type, 
          transfer_timestamp, 
          transfer_location, 
          notes
        ) VALUES ($1, $2, $3, 'initial_purchase', $4, 'Consumer Purchase', 'Initial consumer purchase')`,
        [watchId, watch.current_owner, buyerAddress, finalConsumerTimestamp]
      );

      await client.query("COMMIT");
      console.log("FIXED: Purchase completed successfully with transaction");

      // Verify the purchase with detailed logging
      const verifyResult = await client.query(
        `SELECT 
           sold, 
           available_for_sale, 
           current_owner, 
           ownership_history, 
           retail_price, 
           consumer_timestamp,
           retailer_timestamp,
           last_transfer_timestamp
         FROM watches 
         WHERE watch_id = $1`,
        [watchId]
      );

      const verification = verifyResult.rows[0];
      console.log("FIXED: Purchase verification:", {
        sold: verification.sold,
        availableForSale: verification.available_for_sale,
        currentOwner: verification.current_owner,
        consumerTimestamp: verification.consumer_timestamp,
        ownershipHistoryLength: verification.ownership_history?.length,
      });

      res.json({
        success: true,
        message: "Watch purchased successfully",
        data: {
          watchId: watchId,
          newOwner: buyerAddress,
          displayPrice: price,
          consumerTimestamp: finalConsumerTimestamp,
          consumerTimestampFormatted: new Date(
            finalConsumerTimestamp
          ).toLocaleString(),
          timestamp: new Date().toISOString(),
          booleanUpdates: {
            sold: true,
            available_for_sale: false,
            ownership_transferred: true,
          },
        },
        verification: verification,
      });
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    }
  } catch (err) {
    console.error("FIXED: Error purchasing watch:", err);
    res.status(500).json({
      success: false,
      message: "Error purchasing watch",
      error: err.message,
    });
  }
});

// FIXED: Enhanced consumer statistics with timestamp analysis
app.get("/consumer/stats/:ownerAddress", async (req, res) => {
  const { ownerAddress } = req.params;

  try {
    console.log("FIXED: Fetching enhanced consumer stats for:", ownerAddress);

    const consumerData = await client.query(
      `SELECT 
         COUNT(*) as total_owned,
         COUNT(CASE WHEN w.consumer_timestamp IS NOT NULL THEN 1 END) as purchased_by_user,
         COUNT(CASE WHEN w.last_transfer_timestamp IS NOT NULL THEN 1 END) as transferred_watches,
         AVG(w.retail_price) as avg_purchase_price,
         MIN(w.consumer_timestamp) as first_purchase,
         MAX(w.consumer_timestamp) as latest_purchase,
         AVG(ai.ai_market_price) as avg_ai_value
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.current_owner = $1`,
      [ownerAddress]
    );

    const stats = consumerData.rows[0];

    res.json({
      success: true,
      owner: ownerAddress,
      statistics: {
        totalOwnedWatches: parseInt(stats.total_owned || 0),
        purchasedByUser: parseInt(stats.purchased_by_user || 0),
        transferredWatches: parseInt(stats.transferred_watches || 0),
        averagePurchasePrice: parseFloat(stats.avg_purchase_price || 0),
        averageAiValue: parseFloat(stats.avg_ai_value || 0),
        firstPurchase: stats.first_purchase,
        latestPurchase: stats.latest_purchase,
        firstPurchaseFormatted: stats.first_purchase
          ? new Date(stats.first_purchase).toLocaleString()
          : null,
        latestPurchaseFormatted: stats.latest_purchase
          ? new Date(stats.latest_purchase).toLocaleString()
          : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("FIXED: Error fetching consumer stats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching consumer statistics",
      error: err.message,
    });
  }
});
// FIXED: Enhanced consumer statistics with timestamp analysis
app.get("/consumer/stats/:ownerAddress", async (req, res) => {
  const { ownerAddress } = req.params;

  try {
    console.log("FIXED: Fetching enhanced consumer stats for:", ownerAddress);

    const consumerData = await client.query(
      `SELECT 
         COUNT(*) as total_owned,
         COUNT(CASE WHEN w.consumer_timestamp IS NOT NULL THEN 1 END) as purchased_by_user,
         COUNT(CASE WHEN w.last_transfer_timestamp IS NOT NULL THEN 1 END) as transferred_watches,
         AVG(w.retail_price) as avg_purchase_price,
         MIN(w.consumer_timestamp) as first_purchase,
         MAX(w.consumer_timestamp) as latest_purchase,
         AVG(ai.ai_market_price) as avg_ai_value
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.current_owner = $1`,
      [ownerAddress]
    );

    const stats = consumerData.rows[0];

    res.json({
      success: true,
      owner: ownerAddress,
      statistics: {
        totalOwnedWatches: parseInt(stats.total_owned || 0),
        purchasedByUser: parseInt(stats.purchased_by_user || 0),
        transferredWatches: parseInt(stats.transferred_watches || 0),
        averagePurchasePrice: parseFloat(stats.avg_purchase_price || 0),
        averageAiValue: parseFloat(stats.avg_ai_value || 0),
        firstPurchase: stats.first_purchase,
        latestPurchase: stats.latest_purchase,
        firstPurchaseFormatted: stats.first_purchase
          ? new Date(stats.first_purchase).toLocaleString()
          : null,
        latestPurchaseFormatted: stats.latest_purchase
          ? new Date(stats.latest_purchase).toLocaleString()
          : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("FIXED: Error fetching consumer stats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching consumer statistics",
      error: err.message,
    });
  }
});
// =============================================================================
// ENHANCED CONSUMER MODULE - TRANSFER OWNERSHIP WITH TRANSACTION SAFETY
// =============================================================================
app.post("/transfer-ownership", async (req, res) => {
  const {
    watchId,
    newOwnerAddress,
    currentOwnerAddress,
    transferLocation,
    transferTimestamp,
    notes,
  } = req.body;

  console.log("=== TRANSFER OWNERSHIP REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("From:", currentOwnerAddress);
  console.log("To:", newOwnerAddress);
  console.log("Location:", transferLocation);
  console.log("Timestamp:", transferTimestamp);
  console.log("==================================");

  if (!watchId || !newOwnerAddress || !currentOwnerAddress) {
    return res.status(400).json({
      success: false,
      message:
        "Watch ID, current owner address, and new owner address are required",
    });
  }

  // Validation: Check for same address
  if (newOwnerAddress.toLowerCase() === currentOwnerAddress.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: "Cannot transfer ownership to the same address",
    });
  }

  // Start transaction for atomic operations
  try {
    await client.query("BEGIN");

    // Check watch exists and ownership
    const checkResult = await client.query(
      `SELECT 
         watch_id, 
         current_owner, 
         sold,
         ownership_history
       FROM watches 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = checkResult.rows[0];
    console.log("Transfer validation:", watch);

    // Validation: Check ownership
    if (
      watch.current_owner?.toLowerCase() !== currentOwnerAddress.toLowerCase()
    ) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "You are not the current owner of this watch",
      });
    }

    // Validation: Ensure watch is sold (purchased)
    if (watch.sold !== true) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "This watch has not been purchased yet and cannot be transferred",
      });
    }

    console.log(
      "Transfer validation passed - proceeding with ownership update"
    );

    const finalTransferTimestamp = parseTimestamp(transferTimestamp);

    // Perform the transfer with last_transfer_timestamp
    const result = await client.query(
      `UPDATE watches 
       SET current_owner = $1, 
           ownership_history = array_append(COALESCE(ownership_history, ARRAY[]::text[]), $1),
           last_transfer_timestamp = $4::TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE watch_id = $2 AND current_owner = $3`,
      [newOwnerAddress, watchId, currentOwnerAddress, finalTransferTimestamp]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Transfer failed. Please verify ownership and try again.",
      });
    }

    // Record detailed transfer history
    await client.query(
      `INSERT INTO ownership_transfers (
        watch_id, 
        from_address, 
        to_address, 
        transfer_type, 
        transfer_timestamp, 
        transfer_location, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        watchId,
        currentOwnerAddress,
        newOwnerAddress,
        "consumer_transfer",
        finalTransferTimestamp,
        transferLocation || "Not specified",
        notes || "Ownership transfer",
      ]
    );

    await client.query("COMMIT");
    console.log("Ownership transferred successfully with transaction safety");

    // Verify the transfer
    const verifyResult = await client.query(
      "SELECT current_owner, ownership_history, last_transfer_timestamp FROM watches WHERE watch_id = $1",
      [watchId]
    );

    res.json({
      success: true,
      message: "Ownership transferred successfully",
      data: {
        watchId: watchId,
        previousOwner: currentOwnerAddress,
        newOwner: newOwnerAddress,
        transferTimestamp: finalTransferTimestamp,
        transferLocation: transferLocation || "Not specified",
        timestamp: new Date().toISOString(),
      },
      verification: verifyResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error transferring ownership:", err);
    res.status(500).json({
      success: false,
      message: "Error transferring ownership",
      error: err.message,
    });
  }
});

// =============================================================================
// NEW TRANSFER HISTORY ENDPOINT
// =============================================================================

app.get("/watch/:watchId/transfer-history", async (req, res) => {
  const { watchId } = req.params;

  console.log("=== GET TRANSFER HISTORY REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("====================================");

  try {
    // Get complete transfer audit trail
    const transferHistory = await client.query(
      `SELECT 
         id,
         from_address,
         to_address,
         transfer_type,
         transfer_timestamp,
         transfer_location,
         notes,
         created_at
       FROM ownership_transfers 
       WHERE watch_id = $1 
       ORDER BY transfer_timestamp DESC, created_at DESC`,
      [watchId]
    );

    // Get current watch state
    const watchData = await client.query(
      `SELECT 
         watch_id,
         current_owner,
         ownership_history,
         last_transfer_timestamp,
         assembler_address,
         distributor_address,
         retailer_address,
         retailer_timestamp,
         consumer_timestamp
       FROM watches 
       WHERE watch_id = $1`,
      [watchId]
    );

    if (watchData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchData.rows[0];

    res.json({
      success: true,
      data: {
        watchId: watchId,
        currentOwner: watch.current_owner,
        ownershipHistory: watch.ownership_history || [],
        lastTransferTimestamp: watch.last_transfer_timestamp,
        transferHistory: transferHistory.rows,
        businessPhases: {
          assembly: {
            address: watch.assembler_address,
            phase: "Manufacturing",
          },
          distribution: {
            address: watch.distributor_address,
            phase: "Distribution",
          },
          retail: {
            address: watch.retailer_address,
            timestamp: watch.retailer_timestamp,
            phase: "Retail",
          },
          firstConsumer: {
            timestamp: watch.consumer_timestamp,
            phase: "Consumer Purchase",
          },
        },
        totalTransfers: transferHistory.rows.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error fetching transfer history:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching transfer history",
      error: err.message,
    });
  }
});

// =============================================================================
// ENHANCED WATCH QUERY ENDPOINTS
// =============================================================================

// Get watches by owner with better data handling including AI analysis
app.get("/watches/owner/:ownerAddress", async (req, res) => {
  const { ownerAddress } = req.params;

  console.log("=== GET WATCHES BY OWNER REQUEST ===");
  console.log("Owner Address:", ownerAddress);
  console.log("====================================");

  try {
    const data = await client.query(
      `SELECT w.*,
       CASE WHEN w.available_for_sale IS TRUE THEN true ELSE false END as available_for_sale,
       CASE WHEN w.sold IS TRUE THEN true ELSE false END as sold,
       CASE WHEN ai.ai_analyzed IS TRUE THEN true ELSE false END as ai_analyzed,
       COALESCE(w.retail_price, 0.00) as retail_price,
       COALESCE(ai.ai_market_price, 0.00) as ai_market_price,
       COALESCE(ai.ai_confidence_score, 0.00) as ai_confidence_score,
       ai.ai_watch_model,
       ai.ai_analysis_date,
       w.last_transfer_timestamp,
       COALESCE(w.ownership_history, ARRAY[]::text[]) as ownership_history,
       ai.month1, ai.month2, ai.month3, ai.month4, ai.month5, ai.month6,
       ai.month7, ai.month8, ai.month9, ai.month10, ai.month11, ai.month12,
       ai.ai_trend_analysis, ai.ai_recommendations
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id 
       WHERE w.current_owner = $1 
       ORDER BY w.last_transfer_timestamp DESC NULLS LAST, w.updated_at DESC, w.created_at DESC`,
      [ownerAddress]
    );

    console.log(`Found ${data.rows.length} watches for owner: ${ownerAddress}`);

    res.json({
      success: true,
      watches: data.rows,
      count: data.rows.length,
      owner: ownerAddress,
    });
  } catch (err) {
    console.error("Error fetching watches by owner:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching owned watches",
      error: err.message,
    });
  }
});

app.get("/collection/summary/:ownerAddress", async (req, res) => {
  const { ownerAddress } = req.params;

  try {
    const totalWatches = await client.query(
      "SELECT COUNT(*) FROM watches WHERE current_owner = $1",
      [ownerAddress]
    );

    const aiAnalyzedCount = await client.query(
      `SELECT COUNT(*) FROM watches w 
       JOIN aimodel ai ON w.watch_id = ai.watch_id 
       WHERE w.current_owner = $1 AND ai.ai_analyzed = TRUE`,
      [ownerAddress]
    );

    const totalValue = await client.query(
      `SELECT COUNT(*) as count, 
       AVG(array_length(w.ownership_history, 1)) as avg_ownership_depth,
       AVG(w.retail_price) as avg_price,
       AVG(ai.ai_market_price) as avg_ai_price,
       COUNT(CASE WHEN w.last_transfer_timestamp IS NOT NULL THEN 1 END) as transferred_watches
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.current_owner = $1`,
      [ownerAddress]
    );

    const recentActivity = await client.query(
      `SELECT w.watch_id, w.updated_at, w.created_at, w.retail_price, w.last_transfer_timestamp,
       ai.ai_analyzed, ai.ai_watch_model, ai.ai_market_price 
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id 
       WHERE w.current_owner = $1 
       ORDER BY COALESCE(w.last_transfer_timestamp, w.updated_at, w.created_at) DESC 
       LIMIT 5`,
      [ownerAddress]
    );

    res.json({
      success: true,
      summary: {
        totalWatches: parseInt(totalWatches.rows[0].count),
        aiAnalyzedWatches: parseInt(aiAnalyzedCount.rows[0].count),
        transferredWatches: parseInt(totalValue.rows[0].transferred_watches),
        averageOwnershipDepth:
          parseFloat(totalValue.rows[0].avg_ownership_depth) || 1,
        averagePrice: parseFloat(totalValue.rows[0].avg_price) || 0,
        averageAiPrice: parseFloat(totalValue.rows[0].avg_ai_price) || 0,
        recentActivity: recentActivity.rows,
        owner: ownerAddress,
      },
    });
  } catch (err) {
    console.error("Error fetching collection summary:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching collection summary",
      error: err.message,
    });
  }
});

// =============================================================================
// TRACEABILITY ENDPOINTS
// =============================================================================

app.get("/traceability/:watchId", async (req, res) => {
  const { watchId } = req.params;

  try {
    const watchData = await client.query(
      `SELECT w.*, 
       COALESCE(w.shipping_trail, ARRAY[]::text[]) as shipping_trail,
       COALESCE(w.ownership_history, ARRAY[]::text[]) as ownership_history,
       ai.ai_analyzed,
       ai.ai_watch_model,
       ai.ai_market_price
       FROM watches w 
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id
       WHERE w.watch_id = $1`,
      [watchId]
    );

    if (watchData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchData.rows[0];
    const componentIds = watch.component_ids || [];

    const componentsData = await client.query(
      `SELECT c.*, 
       rm.material_type, rm.origin, rm.supplier_address
       FROM components c
       LEFT JOIN raw_materials rm ON c.raw_material_id = rm.component_id
       WHERE c.component_id = ANY($1)`,
      [componentIds]
    );

    const rawMaterialIds = componentsData.rows
      .map((c) => c.raw_material_id)
      .filter(Boolean);
    let rawMaterialsData = { rows: [] };

    if (rawMaterialIds.length > 0) {
      rawMaterialsData = await client.query(
        "SELECT * FROM raw_materials WHERE component_id = ANY($1)",
        [rawMaterialIds]
      );
    }

    const traceabilityChain = {
      watch: {
        ...watch,
        stage: "Assembly & Distribution",
        stageOrder: 4,
      },
      components: componentsData.rows.map((comp) => ({
        ...comp,
        stage: "Manufacturing & Certification",
        stageOrder: 3,
      })),
      rawMaterials: rawMaterialsData.rows.map((raw) => ({
        ...raw,
        stage: "Raw Material Supply",
        stageOrder: 2,
      })),
      metadata: {
        totalStages: 4,
        completionPercentage: Math.round((4 / 4) * 100),
        verificationStatus: "VERIFIED",
        blockchainRecords: componentIds.length + rawMaterialIds.length + 1,
        retailPrice: watch.retail_price || 0,
        aiAnalyzed: watch.ai_analyzed || false,
        aiWatchModel: watch.ai_watch_model,
        aiMarketPrice: watch.ai_market_price || 0,
        hasTransfers: watch.last_transfer_timestamp !== null,
      },
    };

    res.json({
      success: true,
      traceability: traceabilityChain,
      watch: watch,
      components: componentsData.rows,
      rawMaterials: rawMaterialsData.rows,
    });
  } catch (err) {
    console.error("Error fetching traceability:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching traceability",
      error: err.message,
    });
  }
});

app.get("/watch/:watchId/ownership-history", async (req, res) => {
  const { watchId } = req.params;

  try {
    // Get watch data with all timestamp fields
    const watchData = await client.query(
      `SELECT 
         w.watch_id,
         w.ownership_history,
         w.current_owner,
         w.assembler_address,
         w.distributor_address,
         w.retailer_address,
         w.retailer_timestamp,
         w.consumer_timestamp,
         w.last_transfer_timestamp,
         w.created_at,
         w.updated_at
       FROM watches w
       WHERE w.watch_id = $1`,
      [watchId]
    );

    if (watchData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Watch not found",
      });
    }

    const watch = watchData.rows[0];

    // Get all transfer records in chronological order
    const transferHistory = await client.query(
      `SELECT 
         from_address,
         to_address,
         transfer_timestamp,
         transfer_type,
         notes
       FROM ownership_transfers 
       WHERE watch_id = $1 
       ORDER BY transfer_timestamp ASC`,
      [watchId]
    );

    // Build complete timeline with correct timestamps
    const timeline = [];

    // 1. Assembly phase
    timeline.push({
      phase: "Assembly",
      role: "Assembler",
      address: watch.assembler_address,
      timestamp: watch.created_at,
      order: 1,
    });

    // 2. Distribution phase (if exists)
    if (watch.distributor_address) {
      timeline.push({
        phase: "Distribution",
        role: "Distributor",
        address: watch.distributor_address,
        timestamp: watch.updated_at, // This should ideally be a distributor_timestamp
        order: 2,
      });
    }

    // 3. Retail phase (if exists)
    if (watch.retailer_address && watch.retailer_timestamp) {
      timeline.push({
        phase: "Retail",
        role: "Retailer",
        address: watch.retailer_address,
        timestamp: watch.retailer_timestamp,
        order: 3,
      });
    }

    // 4. Consumer phases - use actual transfer timestamps
    if (watch.consumer_timestamp) {
      timeline.push({
        phase: "Consumer Purchase",
        role: "Consumer 1",
        address:
          transferHistory.rows.find(
            (t) => t.transfer_type === "initial_purchase"
          )?.to_address || watch.current_owner,
        timestamp: watch.consumer_timestamp,
        order: 4,
      });
    }

    // 5. Subsequent transfers - use individual transfer timestamps
    const subsequentTransfers = transferHistory.rows.filter(
      (t) => t.transfer_type === "consumer_transfer"
    );
    subsequentTransfers.forEach((transfer, index) => {
      timeline.push({
        phase: "Ownership Transfer",
        role: `Consumer ${index + 2}`,
        address: transfer.to_address,
        timestamp: transfer.transfer_timestamp,
        order: 5 + index,
      });
    });

    // Sort by timestamp to ensure correct chronological order
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        watchId: watchId,
        currentOwner: watch.current_owner,
        timeline: timeline,
        transferHistory: transferHistory.rows,
        totalOwners: timeline.length,
      },
    });
  } catch (err) {
    console.error("Error fetching ownership history:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching ownership history",
      error: err.message,
    });
  }
});

// =============================================================================
// SEARCH ENDPOINTS
// =============================================================================

app.get("/search/raw-materials", async (req, res) => {
  const { query, type, status, supplier } = req.query;

  try {
    let sqlQuery = "SELECT * FROM raw_materials WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      sqlQuery += ` AND (component_id ILIKE ${paramCount} OR material_type ILIKE ${paramCount} OR origin ILIKE ${paramCount})`;
      params.push(`%${query}%`);
    }

    if (type) {
      paramCount++;
      sqlQuery += ` AND material_type = ${paramCount}`;
      params.push(type);
    }

    if (status === "used") {
      sqlQuery += " AND used = TRUE";
    } else if (status === "available") {
      sqlQuery += " AND (used = FALSE OR used IS NULL)";
    }

    if (supplier) {
      paramCount++;
      sqlQuery += ` AND supplier_address = ${paramCount}`;
      params.push(supplier);
    }

    sqlQuery += " ORDER BY created_at DESC";

    const data = await client.query(sqlQuery, params);
    res.json(data.rows);
  } catch (err) {
    console.error("Error in raw materials search:", err);
    res.status(500).json({
      success: false,
      message: "Error searching raw materials",
      error: err.message,
    });
  }
});

app.get("/search/components", async (req, res) => {
  const { query, type, status, manufacturer } = req.query;

  try {
    let sqlQuery = "SELECT * FROM components WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      sqlQuery += ` AND (component_id ILIKE ${paramCount} OR component_type ILIKE ${paramCount} OR serial_number ILIKE ${paramCount})`;
      params.push(`%${query}%`);
    }

    if (type) {
      paramCount++;
      sqlQuery += ` AND component_type = ${paramCount}`;
      params.push(type);
    }

    if (status) {
      paramCount++;
      sqlQuery += ` AND status = ${paramCount}`;
      params.push(status);
    }

    if (manufacturer) {
      paramCount++;
      sqlQuery += ` AND manufacturer_address = ${paramCount}`;
      params.push(manufacturer);
    }

    sqlQuery += " ORDER BY created_at DESC";

    const data = await client.query(sqlQuery, params);
    res.json(data.rows);
  } catch (err) {
    console.error("Error in components search:", err);
    res.status(500).json({
      success: false,
      message: "Error searching components",
      error: err.message,
    });
  }
});

app.get("/search/watches", async (req, res) => {
  const {
    query,
    shipping_status,
    available,
    assembler,
    price_min,
    price_max,
    ai_analyzed,
    has_transfers,
  } = req.query;

  try {
    let sqlQuery = `
      SELECT w.*, 
      CASE WHEN ai.ai_analyzed IS TRUE THEN true ELSE false END as ai_analyzed,
      ai.ai_watch_model,
      COALESCE(ai.ai_market_price, 0.00) as ai_market_price,
      COALESCE(ai.ai_confidence_score, 0.00) as ai_confidence_score,
      CASE WHEN w.last_transfer_timestamp IS NOT NULL THEN true ELSE false END as has_transfers
      FROM watches w 
      LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      sqlQuery += ` AND (w.watch_id ILIKE ${paramCount} OR ai.ai_watch_model ILIKE ${paramCount})`;
      params.push(`%${query}%`);
    }

    if (shipping_status) {
      paramCount++;
      sqlQuery += ` AND w.shipping_status = ${paramCount}`;
      params.push(parseInt(shipping_status));
    }

    if (available === "true") {
      sqlQuery += " AND w.available_for_sale = TRUE AND w.sold = FALSE";
    } else if (available === "false") {
      sqlQuery +=
        " AND (w.available_for_sale = FALSE OR w.available_for_sale IS NULL)";
    }

    if (assembler) {
      paramCount++;
      sqlQuery += ` AND w.assembler_address = ${paramCount}`;
      params.push(assembler);
    }

    if (price_min) {
      paramCount++;
      sqlQuery += ` AND w.retail_price >= ${paramCount}`;
      params.push(parseFloat(price_min));
    }

    if (price_max) {
      paramCount++;
      sqlQuery += ` AND w.retail_price <= ${paramCount}`;
      params.push(parseFloat(price_max));
    }

    if (ai_analyzed === "true") {
      sqlQuery += " AND ai.ai_analyzed = TRUE";
    } else if (ai_analyzed === "false") {
      sqlQuery += " AND (ai.ai_analyzed = FALSE OR ai.ai_analyzed IS NULL)";
    }

    if (has_transfers === "true") {
      sqlQuery += " AND w.last_transfer_timestamp IS NOT NULL";
    } else if (has_transfers === "false") {
      sqlQuery += " AND w.last_transfer_timestamp IS NULL";
    }

    sqlQuery += " ORDER BY w.created_at DESC";

    const data = await client.query(sqlQuery, params);
    res.json(data.rows);
  } catch (err) {
    console.error("Error in watches search:", err);
    res.status(500).json({
      success: false,
      message: "Error searching watches",
      error: err.message,
    });
  }
});

// =============================================================================
// STATISTICS ENDPOINTS WITH AI ANALYSIS DATA
// =============================================================================

app.get("/stats", async (req, res) => {
  try {
    const stats = {};

    const rawMaterialsCount = await client.query(
      "SELECT COUNT(*) FROM raw_materials"
    );
    const componentsCount = await client.query(
      "SELECT COUNT(*) FROM components"
    );
    const watchesCount = await client.query("SELECT COUNT(*) FROM watches");
    const usersCount = await client.query("SELECT COUNT(*) FROM users");

    stats.rawMaterials = parseInt(rawMaterialsCount.rows[0].count);
    stats.components = parseInt(componentsCount.rows[0].count);
    stats.watches = parseInt(watchesCount.rows[0].count);
    stats.users = parseInt(usersCount.rows[0].count);

    const rawMaterialsAvailable = await client.query(
      "SELECT COUNT(*) FROM raw_materials WHERE used = FALSE OR used IS NULL"
    );
    const rawMaterialsUsed = await client.query(
      "SELECT COUNT(*) FROM raw_materials WHERE used = TRUE"
    );

    stats.rawMaterialsAvailable = parseInt(rawMaterialsAvailable.rows[0].count);
    stats.rawMaterialsUsed = parseInt(rawMaterialsUsed.rows[0].count);

    const componentStatus = await client.query(
      "SELECT status, COUNT(*) FROM components GROUP BY status"
    );
    stats.componentStatus = componentStatus.rows.map((row) => ({
      status: row.status,
      count: parseInt(row.count),
      label:
        row.status === "0"
          ? "Created"
          : row.status === "1"
          ? "Certified"
          : "Used in Assembly",
    }));

    const shippingStats = await client.query(
      "SELECT shipping_status, COUNT(*) FROM watches WHERE shipping_status IS NOT NULL GROUP BY shipping_status"
    );
    stats.shippingStatus = shippingStats.rows.map((row) => ({
      status: parseInt(row.shipping_status),
      count: parseInt(row.count),
      label:
        row.shipping_status === 0
          ? "Not Shipped"
          : row.shipping_status === 1
          ? "Shipped"
          : row.shipping_status === 2
          ? "In Transit"
          : "Delivered",
    }));

    const watchesAvailable = await client.query(
      "SELECT COUNT(*) FROM watches WHERE available_for_sale = TRUE AND sold = FALSE"
    );
    const watchesSold = await client.query(
      "SELECT COUNT(*) FROM watches WHERE sold = TRUE"
    );

    stats.watchesAvailable = parseInt(watchesAvailable.rows[0].count);
    stats.watchesSold = parseInt(watchesSold.rows[0].count);

    // Enhanced AI Analysis Statistics from aimodel table
    const aiStats = await client.query(
      "SELECT COUNT(*) FROM aimodel WHERE ai_analyzed = TRUE"
    );
    stats.aiAnalyzedWatches = parseInt(aiStats.rows[0].count);

    // Transfer statistics
    const transferStats = await client.query(
      `SELECT 
         COUNT(CASE WHEN last_transfer_timestamp IS NOT NULL THEN 1 END) as watches_with_transfers,
         COUNT(*) as total_transfers
       FROM watches w
       WHERE w.last_transfer_timestamp IS NOT NULL
       UNION ALL
       SELECT COUNT(*), 0 FROM ownership_transfers`
    );

    stats.watchesWithTransfers =
      transferStats.rows.length > 0
        ? parseInt(transferStats.rows[0].watches_with_transfers || 0)
        : 0;

    const totalTransfersResult = await client.query(
      "SELECT COUNT(*) FROM ownership_transfers"
    );
    stats.totalOwnershipTransfers = parseInt(
      totalTransfersResult.rows[0].count
    );

    const priceStats = await client.query(
      `SELECT 
         AVG(w.retail_price) as avg_price,
         MIN(w.retail_price) as min_price,
         MAX(w.retail_price) as max_price,
         COUNT(*) as priced_watches,
         AVG(ai.ai_market_price) as avg_ai_price,
         MIN(ai.ai_market_price) as min_ai_price,
         MAX(ai.ai_market_price) as max_ai_price
       FROM watches w
       LEFT JOIN aimodel ai ON w.watch_id = ai.watch_id 
       WHERE w.retail_price > 0 OR ai.ai_market_price > 0`
    );

    if (priceStats.rows[0].priced_watches > 0) {
      stats.priceStatistics = {
        averagePrice: parseFloat(priceStats.rows[0].avg_price) || 0,
        minimumPrice: parseFloat(priceStats.rows[0].min_price) || 0,
        maximumPrice: parseFloat(priceStats.rows[0].max_price) || 0,
        pricedWatches: parseInt(priceStats.rows[0].priced_watches),
        averageAiPrice: parseFloat(priceStats.rows[0].avg_ai_price) || 0,
        minimumAiPrice: parseFloat(priceStats.rows[0].min_ai_price) || 0,
        maximumAiPrice: parseFloat(priceStats.rows[0].max_ai_price) || 0,
      };
    }

    const materialTypes = await client.query(
      "SELECT material_type, COUNT(*) FROM raw_materials GROUP BY material_type"
    );
    stats.materialTypes = materialTypes.rows;

    const componentTypes = await client.query(
      "SELECT component_type, COUNT(*) FROM components GROUP BY component_type"
    );
    stats.componentTypes = componentTypes.rows;

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error fetching statistics:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: err.message,
    });
  }
});

app.get("/stats/:role", async (req, res) => {
  const { role } = req.params;

  try {
    let stats = {};

    switch (role) {
      case "supplier":
        const supplierMaterials = await client.query(
          "SELECT COUNT(*) as total, COUNT(CASE WHEN used = TRUE THEN 1 END) as used FROM raw_materials"
        );
        stats = {
          totalMaterials: parseInt(supplierMaterials.rows[0].total),
          materialsUsed: parseInt(supplierMaterials.rows[0].used),
          materialsAvailable:
            parseInt(supplierMaterials.rows[0].total) -
            parseInt(supplierMaterials.rows[0].used),
        };
        break;

      case "manufacturer":
        const manufacturerComponents = await client.query(
          `SELECT COUNT(*) as total, 
           COUNT(CASE WHEN status = '1' THEN 1 END) as certified,
           COUNT(CASE WHEN status = '2' THEN 1 END) as used
           FROM components`
        );
        stats = {
          totalComponents: parseInt(manufacturerComponents.rows[0].total),
          componentsCertified: parseInt(
            manufacturerComponents.rows[0].certified
          ),
          componentsUsed: parseInt(manufacturerComponents.rows[0].used),
        };
        break;

      case "assembler":
        const assemblerWatches = await client.query(
          `SELECT COUNT(*) as total,
           COUNT(CASE WHEN shipping_status >= 1 THEN 1 END) as shipped,
           COUNT(CASE WHEN shipping_status = 3 THEN 1 END) as delivered
           FROM watches`
        );

        const assemblerAiStats = await client.query(
          `SELECT COUNT(*) as ai_analyzed
           FROM watches w
           JOIN aimodel ai ON w.watch_id = ai.watch_id
           WHERE ai.ai_analyzed = TRUE`
        );

        stats = {
          totalWatches: parseInt(assemblerWatches.rows[0].total),
          watchesShipped: parseInt(assemblerWatches.rows[0].shipped),
          watchesDelivered: parseInt(assemblerWatches.rows[0].delivered),
          watchesAiAnalyzed: parseInt(assemblerAiStats.rows[0].ai_analyzed),
        };
        break;

      case "retailer":
        const retailerStats = await client.query(
          `SELECT COUNT(*) as total_available,
           COUNT(CASE WHEN w.sold = TRUE THEN 1 END) as sold,
           AVG(w.retail_price) as avg_price
           FROM watches w
           WHERE w.available_for_sale = TRUE`
        );

        const retailerAiStats = await client.query(
          `SELECT COUNT(*) as ai_analyzed
           FROM watches w
           JOIN aimodel ai ON w.watch_id = ai.watch_id
           WHERE w.available_for_sale = TRUE AND ai.ai_analyzed = TRUE`
        );

        stats = {
          watchesAvailable: parseInt(retailerStats.rows[0].total_available),
          watchesSold: parseInt(retailerStats.rows[0].sold),
          averagePrice: parseFloat(retailerStats.rows[0].avg_price) || 0,
          watchesAiAnalyzed: parseInt(retailerAiStats.rows[0].ai_analyzed),
        };
        break;

      case "consumer":
        const consumerStats = await client.query(
          `SELECT COUNT(*) as owned_watches,
           COUNT(CASE WHEN w.last_transfer_timestamp IS NOT NULL THEN 1 END) as transferred_watches,
           AVG(w.retail_price) as avg_purchase_price
           FROM watches w
           WHERE w.sold = TRUE`
        );

        stats = {
          ownedWatches: parseInt(consumerStats.rows[0].owned_watches),
          transferredWatches: parseInt(
            consumerStats.rows[0].transferred_watches
          ),
          averagePurchasePrice:
            parseFloat(consumerStats.rows[0].avg_purchase_price) || 0,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role specified",
        });
    }

    res.json({
      success: true,
      role: role,
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Error fetching ${role} statistics:`, err.message);
    res.status(500).json({
      success: false,
      message: `Error fetching ${role} statistics`,
      error: err.message,
    });
  }
});
app.post("/rollback-transfer", async (req, res) => {
  const { watchId, previousOwner } = req.body;

  console.log("=== ROLLBACK TRANSFER REQUEST ===");
  console.log("Watch ID:", watchId);
  console.log("Reverting to previous owner:", previousOwner);

  try {
    await client.query("BEGIN");

    // Revert ownership back to previous owner
    const result = await client.query(
      `UPDATE watches 
       SET current_owner = $1, 
           last_transfer_timestamp = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE watch_id = $2`,
      [previousOwner, watchId]
    );

    // Remove the last entry from ownership history
    await client.query(
      `UPDATE watches 
       SET ownership_history = array_remove(ownership_history, ownership_history[array_length(ownership_history, 1)])
       WHERE watch_id = $1`,
      [watchId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Transfer rolled back successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Rollback failed:", error);
    res.status(500).json({
      success: false,
      message: "Rollback failed",
      error: error.message,
    });
  }
});
// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  console.log(`Supply Chain Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("\nServer shutting down...");
  client.end(() => {
    console.log("Database connection closed.");
    process.exit(0);
  });
});
