import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchWithAuth, fetchPublic } from '../../api';

export const NFCRedirect = () => {
  const { nfc_tag_id } = useParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // If admin, fetch the product to get the ID for edit page
    if (user && user.is_staff) {
      const getProductId = async () => {
        try {
          const res = await fetchWithAuth(`/api/products/lookup_nfc/?nfc_tag_id=${encodeURIComponent(nfc_tag_id)}`);
          if (res.ok) {
            const data = await res.json();
            // Redirect to admin edit page
            window.location.href = `/adminInventory/${data.id}`;
          }
        } catch (err) {
          console.error('Failed to fetch product:', err);
        }
      };
      getProductId();
    }
  }, [nfc_tag_id, user, loading]);

  // If not admin or loading, redirect to store item detail
  if (!loading && (!user || !user.is_staff)) {
    return <Navigate to={`/item/${nfc_tag_id}`} replace />;
  }

  return <div>Loading...</div>;
};
