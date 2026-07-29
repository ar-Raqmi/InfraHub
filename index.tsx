import { apiService } from './services/apiService';
import { PageUrl } from './lib/appUrl';

if (apiService.getCurrentUser()) {
  window.location.replace(PageUrl.dashboard());
} else {
  window.location.replace(PageUrl.login);
}
