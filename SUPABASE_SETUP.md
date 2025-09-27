# Supabase Setup Guide

This guide will help you switch from mock data to real Supabase data.

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API key

### 2. Set Up Database
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL to create tables and sample data

### 3. Update Environment Variables
Create a `.env` file in your project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_API_KEY=your_supabase_anon_key
PORT=5050
```

### 4. Switch to Supabase Data
In `app1/screens/dashboard.js`, change the configuration:

```javascript
const CONFIG = {
  USE_MOCK_DATA: false, // Change this to false
  API_ENDPOINTS: {
    HOT_TOPIC: "/parties/hot-topic",
    UPCOMING: "/parties/upcoming", 
    SEARCH: "/parties/search",
    LIKE: "/parties"
  }
};
```

## 📊 Database Schema

### Parties Table
- `id` - Primary key
- `title` - Event title
- `attendees` - Current/max attendees (e.g., "23/96")
- `location` - Event location
- `date` - Event date and time
- `administrator` - Event organizer
- `price` - Event price
- `image` - Event image URL
- `tags` - Array of event tags
- `liked` - Boolean for like status
- `category` - Either "hot-topic" or "upcoming"
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Users Table
- `id` - Primary key
- `name` - User name
- `email` - User email
- `profile_image` - Profile image URL
- `member_since` - Membership start date
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🔧 API Endpoints

The following endpoints are already implemented in your server:

- `GET /parties/hot-topic` - Get featured events
- `GET /parties/upcoming` - Get upcoming events
- `GET /parties` - Get all parties
- `GET /parties/search?q=query` - Search parties
- `PATCH /parties/:id/like` - Toggle like status

## 🎯 Benefits of Supabase Integration

1. **Real-time Updates**: Changes sync across all clients
2. **Persistent Data**: Data survives server restarts
3. **Scalability**: Handles large amounts of data
4. **Security**: Built-in authentication and authorization
5. **Analytics**: Track usage and performance

## 🔄 Migration Process

1. **Phase 1**: Keep `USE_MOCK_DATA: true` and test with mock data
2. **Phase 2**: Set up Supabase and test with real data
3. **Phase 3**: Set `USE_MOCK_DATA: false` for production

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors**: Check your Supabase URL and API key
2. **Table not found**: Make sure you ran the schema.sql file
3. **Permission denied**: Check your RLS policies in Supabase
4. **CORS errors**: Ensure your domain is allowed in Supabase settings

### Debug Mode

To debug API calls, check the browser console and server logs. The service layer will automatically fall back to mock data if Supabase calls fail.

## 📈 Performance Tips

1. **Use indexes**: The schema includes performance indexes
2. **Limit results**: Add pagination for large datasets
3. **Cache data**: Implement client-side caching for frequently accessed data
4. **Optimize images**: Use appropriate image sizes and formats
