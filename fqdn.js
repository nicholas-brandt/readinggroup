const _own_domain = await Deno.readTextFile("./fqdn.txt");
const fqdn = _own_domain.match(/^[^\n]*/)[0];
export default fqdn;