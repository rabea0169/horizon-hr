const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }
  });
  const tables = [
    'attendance','leaves','performance_reviews','candidates','job_postings',
    'payroll_records','shift_assignments','shifts','advances','bonus_penalties',
    'daily_production','production_orders','production_lines','model_stages',
    'production_models','piece_rate_records','machines','inventory_transactions',
    'inventory_items','supply_order_items','supply_orders','suppliers',
    'cutting_orders','work_orders','bundle_tracking','bundles','bom_records',
    'qc_records','mrp_records','challan_items','challans','subcontracts',
    'sales_orders','crm_interactions','crm_customers','cost_calculations',
    'employees','departments','print_settings','system_settings','activities',
    'fabric_rolls','cut_plans','marker_plans','sam_records','line_balancing',
    'style_color_size_matrix','warehouses','warehouse_bins','reorder_rules',
    'product_lifecycle','tech_packs','design_revisions','sample_reviews',
    'custom_reports','report_templates','buyer_portal_users','production_forecasts',
    'audit_log'
  ];
  for (const t of tables) {
    try { await conn.execute('DELETE FROM `' + t + '`'); process.stdout.write('.'); }
    catch(e) { process.stdout.write('x'); }
  }
  await conn.end();
  console.log('\nAll cleared!');
}
run().catch(console.error);
