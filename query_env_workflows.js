const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});
console.log(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEnvWorkflows() {
  const { data, error, count } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true })
    .eq('workflow_type', 'environment');
  
  if (error) {
    console.error('Error fetching workflows:', error);
  } else {
    console.log(`Number of Environment workflows: ${count}`);
    const { data: workflows } = await supabase.from('workflows').select('*').eq('workflow_type', 'environment');
    console.log('Workflows:', workflows);
  }
}

checkEnvWorkflows();
