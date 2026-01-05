"""
Shared configuration management.
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "BenGo"
    app_env: str = "development"
    debug: bool = True
    api_version: str = "v1"
    
    # Database
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    
    # Service Ports
    auth_service_port: int = 8001
    wallet_service_port: int = 8002
    payments_service_port: int = 8003
    cards_service_port: int = 8004
    loans_service_port: int = 8005
    crypto_service_port: int = 8006
    travel_service_port: int = 8007
    rewards_service_port: int = 8008
    risk_service_port: int = 8009
    
    # External APIs
    payment_gateway_api_key: str = ""
    payment_gateway_api_url: str = ""
    bank_api_key: str = ""
    bank_api_url: str = ""
    crypto_provider_api_key: str = ""
    crypto_provider_api_url: str = ""
    crypto_wallet_address: str = ""
    kyc_provider_api_key: str = ""
    kyc_provider_api_url: str = ""
    travel_api_key: str = ""
    travel_api_url: str = ""
    
    # Security
    encryption_key: str
    allowed_origins: str = "http://localhost:3000,http://localhost:8080"
    
    # Feature Flags
    enable_crypto: bool = True
    enable_loans: bool = True
    enable_travel: bool = True
    enable_rewards: bool = True
    
    # Limits
    max_loan_amount: int = 50000
    min_transaction_amount: int = 100
    max_transaction_amount: int = 10000000
    
    # Sanctioned Regions
    sanctioned_regions: str = "IR,KR,CU,SY"
    
    @property
    def sanctioned_regions_list(self) -> List[str]:
        """Get sanctioned regions as a list."""
        return [r.strip().upper() for r in self.sanctioned_regions.split(",")]
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list."""
        return [o.strip() for o in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

