-- Migration 009: Add generation_input column to mcp_servers
-- Stores the full generation request (serverName, description, apiConfig, tools, resources, prompts)
-- for analysis and audit purposes.
ALTER TABLE mcp_servers
ADD COLUMN IF NOT EXISTS generation_input JSONB DEFAULT NULL;
COMMENT ON COLUMN mcp_servers.generation_input IS 'Full generation request payload — serverName, description, apiConfig, tools, resources, prompts.';