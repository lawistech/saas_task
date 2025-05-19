<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('is_sales_pipeline')->default(false)->after('status');
            $table->string('sales_stage')->nullable()->after('is_sales_pipeline');
            $table->decimal('deal_value', 10, 2)->nullable()->after('budget');
            $table->string('deal_owner')->nullable()->after('deal_value');
            $table->timestamp('expected_close_date')->nullable()->after('deal_owner');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['is_sales_pipeline', 'sales_stage', 'deal_value', 'deal_owner', 'expected_close_date']);
        });
    }
};
