import type { LeaseData } from '@/constants';

export const demoCarLease: any = {
  title: "2023 BMW 3 Series Lease",
  assetType: "Car",
  assetName: "BMW 3 Series 320i",
  riskScore: 35,
  startDate: "2024-01-15",
  endDate: "2026-01-15",
  monthlyRent: "CHF 850",
  deposit: "CHF 2,550",
  noticePeriod: "3 months",
  clauses: [
    {
      section: "Article 3.1",
      text: "Vehicle must be returned in same condition as received, normal wear excepted",
      riskLevel: "medium"
    },
    {
      section: "Article 4.2",
      text: "Lessee responsible for all maintenance and service costs",
      riskLevel: "high"
    },
    {
      section: "Article 5.1",
      text: "Maximum 15,000 km per year, CHF 0.25 per additional km",
      riskLevel: "medium"
    }
  ],
  inspectionItems: [
    {
      id: "exterior_front",
      name: "Front Bumper & Hood",
      description: "Check for scratches, dents, paint chips on front bumper and hood",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Front view", "Close-up bumper", "Hood detail"],
      whyMatters: "Front damage is expensive to repair and often disputed at return"
    },
    {
      id: "exterior_sides",
      name: "Side Panels & Doors",
      description: "Inspect both sides for door dings, scratches, and panel alignment",
      priority: "high",
      recommendedPhotos: 4,
      photoAngles: ["Driver side full", "Passenger side full", "Door handles", "Side mirrors"],
      whyMatters: "Side damage from parking lots is common and costly"
    },
    {
      id: "exterior_rear",
      name: "Rear Bumper & Trunk",
      description: "Check rear bumper, trunk lid, and tail lights for damage",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Rear view", "Bumper close-up", "Trunk detail"],
      whyMatters: "Rear damage often occurs during parking and reversing"
    },
    {
      id: "wheels_tires",
      name: "Wheels & Tires",
      description: "Document wheel condition, tire tread depth, and any curb damage",
      priority: "high",
      recommendedPhotos: 4,
      photoAngles: ["All 4 wheels", "Tire tread", "Wheel rims", "Valve caps"],
      whyMatters: "Wheel damage and tire wear are major return inspection points"
    },
    {
      id: "interior_seats",
      name: "Seats & Upholstery",
      description: "Check all seats for stains, tears, burns, and wear patterns",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Front seats", "Rear seats", "Seat details"],
      whyMatters: "Interior damage significantly affects vehicle value"
    },
    {
      id: "interior_dashboard",
      name: "Dashboard & Console",
      description: "Document dashboard condition, screen, controls, and center console",
      priority: "medium",
      recommendedPhotos: 2,
      photoAngles: ["Full dashboard", "Center console"],
      whyMatters: "Electronic components and controls are expensive to replace"
    },
    {
      id: "interior_carpet",
      name: "Carpets & Floor Mats",
      description: "Check carpets and mats for stains, burns, and excessive wear",
      priority: "medium",
      recommendedPhotos: 2,
      photoAngles: ["Front floor", "Rear floor"],
      whyMatters: "Carpet damage can indicate poor maintenance"
    },
    {
      id: "odometer",
      name: "Odometer Reading",
      description: "Record current mileage clearly visible",
      priority: "high",
      recommendedPhotos: 1,
      photoAngles: ["Odometer display"],
      whyMatters: "Mileage is crucial for lease agreement compliance",
      contractReference: "Article 5.1 - Mileage Limit"
    }
  ],
  activeStage: "review",
  unlockedStages: 0
};

export const demoPropertyLease: any = {
  title: "Lausanne City Center Apartment",
  assetType: "Property",
  assetName: "2-Bedroom Apartment, Rue de Bourg 45",
  riskScore: 58,
  startDate: "2024-02-01",
  endDate: "2025-02-01",
  monthlyRent: "CHF 2,200",
  deposit: "CHF 6,600",
  noticePeriod: "3 months",
  clauses: [
    {
      section: "Article 6.2",
      text: "Tenant responsible for all damage beyond normal wear and tear",
      riskLevel: "high"
    },
    {
      section: "Article 8.1",
      text: "Walls must be repainted in original color before return",
      riskLevel: "high"
    },
    {
      section: "Article 9.3",
      text: "All fixtures and fittings must remain in working condition",
      riskLevel: "medium"
    },
    {
      section: "Article 10.1",
      text: "Tenant may not make structural modifications without written consent",
      riskLevel: "medium"
    }
  ],
  inspectionItems: [
    {
      id: "living_room",
      name: "Living Room Condition",
      description: "Document walls, floors, windows, and any existing damage",
      priority: "high",
      recommendedPhotos: 4,
      photoAngles: ["Full room view", "Each wall", "Floor condition", "Windows"],
      whyMatters: "Living room is the most used space and prone to wear",
      contractReference: "Article 6.2"
    },
    {
      id: "kitchen",
      name: "Kitchen & Appliances",
      description: "Check all appliances, cabinets, countertops, and sink for damage",
      priority: "high",
      recommendedPhotos: 5,
      photoAngles: ["Full kitchen", "Stove/oven", "Refrigerator", "Sink", "Cabinets"],
      whyMatters: "Kitchen damage is expensive and frequently disputed",
      contractReference: "Article 9.3"
    },
    {
      id: "bathroom",
      name: "Bathroom Condition",
      description: "Document shower/tub, toilet, sink, tiles, and any water damage",
      priority: "high",
      recommendedPhotos: 4,
      photoAngles: ["Full bathroom", "Shower/tub", "Toilet", "Sink & mirror"],
      whyMatters: "Water damage and mold are serious issues in bathrooms"
    },
    {
      id: "bedroom_1",
      name: "Master Bedroom",
      description: "Check walls, floor, closets, and windows for damage",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Full room", "Closet interior", "Windows"],
      whyMatters: "Bedroom condition affects habitability and deposit return"
    },
    {
      id: "bedroom_2",
      name: "Second Bedroom",
      description: "Document walls, floor, closets, and windows",
      priority: "medium",
      recommendedPhotos: 3,
      photoAngles: ["Full room", "Closet", "Windows"],
      whyMatters: "All rooms must be documented for complete protection"
    },
    {
      id: "walls_paint",
      name: "Wall Paint Condition",
      description: "Check all walls for holes, marks, stains, and paint condition",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Each room walls", "Close-up of marks", "Paint condition"],
      whyMatters: "You may be required to repaint at move-out",
      contractReference: "Article 8.1"
    },
    {
      id: "floors",
      name: "Floor Condition",
      description: "Document all floor types (hardwood, tile, carpet) for scratches and damage",
      priority: "high",
      recommendedPhotos: 3,
      photoAngles: ["Living room floor", "Bedroom floors", "Kitchen floor"],
      whyMatters: "Floor damage is costly and often leads to deposit deductions"
    },
    {
      id: "windows_doors",
      name: "Windows & Doors",
      description: "Check all windows, doors, handles, and locks for functionality",
      priority: "medium",
      recommendedPhotos: 3,
      photoAngles: ["All windows", "Entry door", "Interior doors"],
      whyMatters: "Broken fixtures must be repaired before move-out"
    },
    {
      id: "balcony",
      name: "Balcony/Terrace",
      description: "Document balcony floor, railing, and any outdoor damage",
      priority: "medium",
      recommendedPhotos: 2,
      photoAngles: ["Full balcony", "Floor & railing"],
      whyMatters: "Outdoor spaces are often overlooked but can have damage"
    },
    {
      id: "fixtures",
      name: "Light Fixtures & Switches",
      description: "Check all lights, switches, and electrical outlets work properly",
      priority: "low",
      recommendedPhotos: 2,
      photoAngles: ["Light fixtures", "Switches & outlets"],
      whyMatters: "Non-functional fixtures must be reported immediately",
      contractReference: "Article 9.3"
    }
  ],
  activeStage: "review",
  unlockedStages: 0
};

export const demoLeases = {
  car: demoCarLease,
  property: demoPropertyLease
};
