<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users with known credentials
        $users = [
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => Hash::make('password123'),
                'bio' => 'Test user for development',
                'phone' => '+1234567890',
                'address' => '123 Test Street, Test City, TC 12345',
            ],
            [
                'name' => 'George Curay',
                'email' => 'georgecuray7@gmail.com',
                'password' => Hash::make('password123'),
                'bio' => 'Project manager and developer',
                'phone' => '+1987654321',
                'address' => '456 Admin Avenue, Admin City, AC 54321',
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('admin123'),
                'bio' => 'System administrator',
                'phone' => '+1555123456',
                'address' => '789 Admin Road, Admin Town, AT 98765',
            ]
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->command->info('Users seeded successfully!');
        $this->command->info('Test credentials:');
        $this->command->info('- test@example.com / password123');
        $this->command->info('- georgecuray7@gmail.com / password123');
        $this->command->info('- admin@example.com / admin123');
    }
}
