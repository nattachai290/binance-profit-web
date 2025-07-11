import type { NextConfig } from 'next';

interface CustomExperimental {
    missingSuspenseWithCSRBailout: boolean;
}

const nextConfig: NextConfig & { experimental: CustomExperimental } = {
    experimental: {
        missingSuspenseWithCSRBailout: false,
    }
};

export default nextConfig;
