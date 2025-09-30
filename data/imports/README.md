# Hotel Data Import

This directory contains example CSV files for importing hotel data using the CSV provider.

## File Format

### locations.csv
Defines geographic locations where hotels are situated.

**Columns:**
- `name` - Location identifier (used to link hotels)
- `city` - City name
- `country` - Country name
- `latitude` - Latitude coordinate (decimal)
- `longitude` - Longitude coordinate (decimal)

### hotels.csv
Defines hotels and their basic information.

**Columns:**
- `title` - Hotel name (unique identifier used to link rooms)
- `description` - Hotel description
- `location_name` - Reference to location name from locations.csv
- `star_rating` - Star rating (1-5)

### rooms.csv
Defines rooms within hotels.

**Columns:**
- `hotel_title` - Reference to hotel title from hotels.csv
- `category` - Room category (e.g., Standard, Deluxe, Suite)
- `description` - Room description
- `capacity` - Maximum guest capacity

### offers.csv
Defines pricing and availability offers for rooms.

**Columns:**
- `hotel_title` - Reference to hotel title from hotels.csv
- `room_category` - Reference to room category from rooms.csv
- `price` - Base price
- `discount` - Discount amount (optional, defaults to 0)
- `availability` - Availability status (true/false/1/0/yes/no)
- `starts_on` - Start date (YYYY-MM-DD)
- `ends_on` - End date (YYYY-MM-DD)

## Usage

To import data from these CSV files:

```bash
php scripts/import.php csv data/imports
```

Or specify an absolute path:

```bash
php scripts/import.php csv /path/to/your/data
```

## Notes

- The import script checks for duplicates and skips existing records
- Records are imported in dependency order: locations → hotels → rooms → offers
- Missing references (e.g., a hotel referencing a non-existent location) will be skipped with a warning
- All CSV files must have headers matching the column names above

