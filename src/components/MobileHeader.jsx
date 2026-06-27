import { useLocation, useNavigate } from 'react-router-dom';

const CHILD_ROUTES = ['/listing/', '/notifications', '/profile/'];

export default function MobileHeader({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isChild = CHILD_ROUTES.some((r) => location.pathname.startsWith(r));

  return null;
























}