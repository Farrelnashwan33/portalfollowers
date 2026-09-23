-- Seed Data for Portal Followers
-- Default Instagram Growth Packages

INSERT INTO public.packages (name, followers, price, description, estimated_time, badge, is_active)
VALUES
    ('Starter Boost', 100, 15000, 'Cocok untuk akun baru yang ingin meningkatkan social proof awal secara instan.', '1-3 Jam', 'Pemula', true),
    ('Creator Growth', 500, 45000, 'Pilihan ideal bagi content creator untuk membangun kredibilitas profil dengan cepat.', '3-6 Jam', 'Hemat', true),
    ('Influencer Popular', 1000, 79000, 'Paket paling diminati! Meningkatkan visibilitas algoritma dan daya tarik akun bisnis.', '6-12 Jam', 'Paling Populer', true),
    ('Brand Authority', 2500, 175000, 'Dirancang khusus untuk brand, online shop, dan public figure yang membutuhkan reputasi tinggi.', '12-24 Jam', 'Best Value', true),
    ('Enterprise Scale', 5000, 320000, 'Akselerasi followers skala besar untuk dominasi industri dan tingkat konversi maksimal.', '24-48 Jam', 'Sultan', true),
    ('Ultimate Celebrity', 10000, 590000, 'Solusi komprehensif pertumbuhan masif dengan pengiriman bertahap paling aman dan natural.', '2-3 Hari', 'Eksklusif', true)
ON CONFLICT DO NOTHING;
