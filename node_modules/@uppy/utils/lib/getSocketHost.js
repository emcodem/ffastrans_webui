export default function getSocketHost(url) {
  var _regex$exec;
  // get the host domain
  const regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/i;
  const host = (_regex$exec = regex.exec(url)) == null ? void 0 : _regex$exec[1];
  const socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss';
  return `${socketProtocol}://${host}`;
}