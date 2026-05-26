import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Economy",
    description: "Fuel efficient cars for everyday city travel.",
  },
  {
    name: "SUV",
    description: "Spacious vehicles for family trips and rougher roads.",
  },
  {
    name: "Luxury",
    description: "Premium cars with extra comfort and performance.",
  },
];

const locations = [
  {
    name: "Kathmandu Main Office",
    address: "Durbar Marg",
    city: "Kathmandu",
    phone: "+977-9800000001",
  },
  {
    name: "Tribhuvan Airport Counter",
    address: "Airport Gate",
    city: "Kathmandu",
    phone: "+977-9800000002",
  },
  {
    name: "Pokhara Lakeside Branch",
    address: "Lakeside Road",
    city: "Pokhara",
    phone: "+977-9800000003",
  },
];

const vehicles = [
  {
    slug: "toyota-corolla-2022",
    name: "Toyota Corolla",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    imageUrl:
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 65,
    doors: 4,
    seats: 5,
    luggage: "2 Bags",
    transmission: "Automatic",
    fuelType: "Petrol",
    registrationNo: "BA-01-CHA-2022",
    status: "AVAILABLE",
    categoryName: "Economy",
  },
  {
    slug: "honda-civic-2021",
    name: "Honda Civic",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    imageUrl:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 70,
    doors: 4,
    seats: 5,
    luggage: "2 Bags",
    transmission: "Automatic",
    fuelType: "Petrol",
    registrationNo: "BA-02-CHA-2021",
    status: "AVAILABLE",
    categoryName: "Economy",
  },
  {
    slug: "hyundai-tucson-2023",
    name: "Hyundai Tucson",
    brand: "Hyundai",
    model: "Tucson",
    year: 2023,
    imageUrl:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 95,
    doors: 4,
    seats: 5,
    luggage: "4 Bags",
    transmission: "Automatic",
    fuelType: "Diesel",
    registrationNo: "BA-03-CHA-2023",
    status: "AVAILABLE",
    categoryName: "SUV",
  },
  {
    slug: "toyota-land-cruiser-2022",
    name: "Toyota Land Cruiser",
    brand: "Toyota",
    model: "Land Cruiser",
    year: 2022,
    imageUrl:
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 150,
    doors: 4,
    seats: 7,
    luggage: "5 Bags",
    transmission: "Automatic",
    fuelType: "Diesel",
    registrationNo: "BA-04-CHA-2022",
    status: "AVAILABLE",
    categoryName: "SUV",
  },
  {
    slug: "bmw-5-series-2022",
    name: "BMW 5 Series",
    brand: "BMW",
    model: "5 Series",
    year: 2022,
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 180,
    doors: 4,
    seats: 5,
    luggage: "3 Bags",
    transmission: "Automatic",
    fuelType: "Petrol",
    registrationNo: "BA-05-CHA-2022",
    status: "AVAILABLE",
    categoryName: "Luxury",
  },
  {
    slug: "mercedes-benz-c-class-2023",
    name: "Mercedes-Benz C-Class",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2023,
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
    pricePerDay: 190,
    doors: 4,
    seats: 5,
    luggage: "3 Bags",
    transmission: "Automatic",
    fuelType: "Petrol",
    registrationNo: "BA-06-CHA-2023",
    status: "AVAILABLE",
    categoryName: "Luxury",
  },
];

async function main() {
  const categoryByName = {};

  for (const category of categories) {
    const savedCategory = await prisma.vehicleCategory.upsert({
      where: {
        name: category.name,
      },
      update: {
        description: category.description,
      },
      create: category,
    });

    categoryByName[savedCategory.name] = savedCategory;
  }

  for (const location of locations) {
    await prisma.location.upsert({
      where: {
        id: `${location.city.toLowerCase()}-${location.name
          .toLowerCase()
          .replaceAll(" ", "-")}`,
      },
      update: location,
      create: {
        id: `${location.city.toLowerCase()}-${location.name
          .toLowerCase()
          .replaceAll(" ", "-")}`,
        ...location,
      },
    });
  }

  for (const vehicle of vehicles) {
    const { categoryName, ...vehicleData } = vehicle;

    await prisma.vehicle.upsert({
      where: {
        slug: vehicle.slug,
      },
      update: {
        ...vehicleData,
        categoryId: categoryByName[categoryName].id,
      },
      create: {
        ...vehicleData,
        categoryId: categoryByName[categoryName].id,
      },
    });
  }

  console.log("Seeded categories, locations, and vehicles.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
