'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, Mail, Globe, Building2, Filter, Loader2, ExternalLink, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProviderService {
  _id: string;
  providerName: string;
  serviceName: string;
  locationName: string;
  address: {
    street: string | null;
    street2: string | null;
    city: string | null;
    state: string;
    zipCode: string | null;
    county: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
    phoneExt: string | null;
  };
  features: string[];
  shortDescription: string | null;
  eligibility: string | null;
  areasServed: string[];
  providerWebsite: string | null;
}

interface SearchResponse {
  success: boolean;
  data: {
    results: ProviderService[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
    filters: {
      counties: string[];
      cities: string[];
      services: string[];
    };
  };
}

interface ProviderDirectoryPanelProps {
  onCreateReferral?: (provider: ProviderService) => void;
  prefilledCounty?: string;
  onClose?: () => void;
}

export function ProviderDirectoryPanel({ onCreateReferral, prefilledCounty, onClose }: ProviderDirectoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState(prefilledCounty || '');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProviderService[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderService | null>(null);
  const [filters, setFilters] = useState({ counties: [], cities: [], services: [] });
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasMore: false });

  const searchProviders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25'
      });

      if (searchQuery) params.set('q', searchQuery);
      if (selectedCounty) params.set('county', selectedCounty);
      if (selectedCity) params.set('city', selectedCity);
      if (selectedService) params.set('service', selectedService);

      const response = await fetch(`/api/providers/search?${params}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(page === 1 ? data.data.results : [...results, ...data.data.results]);
        setPagination(data.data.pagination);
        setFilters(data.data.filters);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCounty, selectedCity, selectedService]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProviders(1);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCounty, selectedCity, selectedService]);

  const handleLoadMore = () => {
    searchProviders(pagination.page + 1);
  };

  const formatPhone = (phone: string | null, ext: string | null) => {
    if (!phone) return null;
    const formatted = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    return ext ? `${formatted} ext. ${ext}` : formatted;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="p-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Provider Directory</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 rounded-full w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search providers or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedCounty || 'all'} onValueChange={(val) => setSelectedCounty(val === 'all' ? '' : val)}>
            <SelectTrigger>
              <SelectValue placeholder="County" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {filters.counties.map(county => (
                <SelectItem key={county} value={county}>{county}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity || 'all'} onValueChange={(val) => setSelectedCity(val === 'all' ? '' : val)}>
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {filters.cities.slice(0, 100).map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService || 'all'} onValueChange={(val) => setSelectedService(val === 'all' ? '' : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {filters.services.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-slate-600">
          {loading ? 'Searching...' : `${pagination.total.toLocaleString()} providers found`}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No providers found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {results.map((provider) => (
                <div
                  key={provider._id}
                  className={`bg-white border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                    selectedProvider?._id === provider._id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => setSelectedProvider(provider)}
                >
                  {/* Provider Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{provider.providerName}</h3>
                      <p className="text-sm text-blue-600 mt-1">{provider.serviceName}</p>
                    </div>
                  </div>

                  {/* Location */}
                  {provider.address.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {provider.address.city}
                        {provider.address.county && `, ${provider.address.county} County`}
                      </span>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex flex-wrap gap-3 text-sm mb-3">
                    {provider.contact.phone && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhone(provider.contact.phone, provider.contact.phoneExt)}</span>
                      </div>
                    )}
                    {provider.contact.email && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{provider.contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {provider.shortDescription && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {provider.shortDescription}
                    </p>
                  )}

                  {/* Features */}
                  {provider.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {provider.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {provider.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {provider.providerWebsite && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(provider.providerWebsite!, '_blank');
                        }}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                    {onCreateReferral && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateReferral(provider);
                        }}
                      >
                        Create Referral
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

