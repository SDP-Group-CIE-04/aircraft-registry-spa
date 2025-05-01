module.exports = {
  domain: process.env.domain,
  clientId: process.env.clientId,
  audience: process.env.audience,
  scopes: [
    'registry.read.operator',
    'registry.read.operator_detail',
    'registry.read.operator_detail.privileged',
    'registry.read.contact_detail',
    'registry.read.contact_detail.privileged',
    'registry.read.pilot',
    'registry.read.pilot_detail',
    'registry.read.pilot_detail.privileged',
    'registry.read.aircraft',
    'registry.read.aircraft_detail',
    'registry.read.aircraft_detail.privileged',
  ],
};
