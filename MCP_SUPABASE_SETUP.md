# MCP Supabase Server Setup Guide

The Supabase MCP (Model Context Protocol) server has been installed and configured. This allows Claude Desktop to interact with your Supabase database directly.

## Installation Status

✅ `@supabase/mcp-server-supabase` installed globally
✅ Claude Desktop configuration file created

## Configuration Required

The MCP server needs your Supabase credentials to function. You need to update the configuration file with your actual Supabase project details.

### Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project or create a new one
3. Go to **Project Settings** → **API**
4. Copy the following values:
   - **Project URL**: This is your `SUPABASE_URL`
   - **service_role key**: This is your `SUPABASE_SERVICE_ROLE_KEY` (IMPORTANT: Use the service_role key, not the anon key!)

⚠️ **Important Security Note**: The service_role key has full admin access to your database. Never share it publicly or commit it to version control.

### Step 2: Update the Configuration File

The configuration file is located at:
```
C:\Users\arifr\AppData\Roaming\Claude\claude_desktop_config.json
```

Replace the placeholder values with your actual Supabase credentials:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": [
        "C:\\Users\\arifr\\AppData\\Roaming\\npm\\node_modules\\@supabase\\mcp-server-supabase\\dist\\transports\\stdio.js"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

After updating the configuration:
1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. The Supabase MCP server will now be available

## Using the Supabase MCP Server

Once configured, you can interact with your Supabase database directly through Claude. Here are some examples:

### Query Data
```
Can you show me all users from the users table?
```

### Create Records
```
Add a new record to the products table with name "New Product" and price 29.99
```

### Update Records
```
Update the user with ID 123 to set their email to newemail@example.com
```

### Delete Records
```
Delete all records from the logs table where created_at is older than 30 days
```

### Run Custom SQL
```
Execute this SQL query: SELECT COUNT(*) as total_users FROM users WHERE created_at > '2024-01-01'
```

### Explore Database Schema
```
Show me the structure of all tables in my database
```

## Available MCP Tools

The Supabase MCP server provides the following tools:

- **List Tables**: View all tables in your database
- **Describe Table**: Get detailed schema information for a specific table
- **Query**: Execute SELECT queries
- **Insert**: Add new records
- **Update**: Modify existing records
- **Delete**: Remove records
- **Execute SQL**: Run custom SQL statements

## Troubleshooting

### MCP Server Not Appearing

If the Supabase MCP server doesn't appear in Claude Desktop:

1. **Check the configuration file path**:
   ```bash
   type "%APPDATA%\Claude\claude_desktop_config.json"
   ```

2. **Verify the MCP server is installed**:
   ```bash
   npm list -g @supabase/mcp-server-supabase
   ```

3. **Check the stdio.js file exists**:
   ```bash
   dir "C:\Users\arifr\AppData\Roaming\npm\node_modules\@supabase\mcp-server-supabase\dist\transports\stdio.js"
   ```

### Connection Errors

**Error**: "Could not connect to Supabase"

**Solutions**:
1. Verify `SUPABASE_URL` is correct (should include https://)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Check that your Supabase project is active
4. Ensure you're using the service_role key, not the anon key

### Permission Errors

If you encounter permission issues with database operations:

1. **Check Row Level Security (RLS) policies** in Supabase Dashboard
2. **Ensure the service_role key bypasses RLS** (it should by default)
3. **Verify the database user has appropriate permissions**

## Security Best Practices

1. **Never commit the configuration file** to version control
2. **Use different keys** for different environments (dev, staging, prod)
3. **Rotate keys regularly** if they might be compromised
4. **Monitor usage** in Supabase Dashboard for suspicious activity
5. **Use environment-specific configurations** when possible

## Multiple Projects

If you work with multiple Supabase projects, you can configure multiple MCP servers:

```json
{
  "mcpServers": {
    "supabase-prod": {
      "command": "node",
      "args": ["C:\\Users\\arifr\\AppData\\Roaming\\npm\\node_modules\\@supabase\\mcp-server-supabase\\dist\\transports\\stdio.js"],
      "env": {
        "SUPABASE_URL": "https://prod-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-prod-key"
      }
    },
    "supabase-dev": {
      "command": "node",
      "args": ["C:\\Users\\arifr\\AppData\\Roaming\\npm\\node_modules\\@supabase\\mcp-server-supabase\\dist\\transports\\stdio.js"],
      "env": {
        "SUPABASE_URL": "https://dev-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-dev-key"
      }
    }
  }
}
```

Then reference them in your prompts:
```
Using the supabase-prod server, show me the active users
```

## Next Steps

1. ✅ Install Supabase MCP server (completed)
2. ✅ Configure Claude Desktop (completed)
3. ⏳ Add your Supabase credentials to the config file
4. ⏳ Restart Claude Desktop
5. ⏳ Test the connection with a simple query

## Resources

- [Supabase MCP Server GitHub](https://github.com/supabase-community/supabase-mcp)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Project Setup Guide](SUPABASE_SETUP.md)